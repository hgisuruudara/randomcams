import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@randomcams/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Public STUN always included as a fallback. A TURN server (e.g. coturn,
// see docker-compose.yml) matters in practice — a large fraction of
// real-world connections sit behind NATs/firewalls that STUN alone can't
// traverse — so it's added from env when configured rather than hardcoded,
// since TURN credentials differ per deployment.
function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;
  if (turnUrl) {
    servers.push({ urls: turnUrl, username: turnUsername, credential: turnCredential });
  }

  return servers;
}

const ICE_SERVERS = buildIceServers();

// The camera/mic stream is owned by useMediaDevices (so it persists across
// the lobby preview and the call itself) and passed in rather than acquired
// here. sessionId/initiator are the only things that should tear down and
// recreate the peer connection - a camera/mic device swap mutates the same
// stream's tracks in place and goes through replaceTrack() below instead,
// so switching cameras mid-call doesn't cause a full renegotiation.
export function useWebRTC(
  socket: Socket | null,
  sessionId: string | null,
  initiator: boolean,
  localStream: MediaStream | null
) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!socket || !sessionId || !localStream) return;

    const appSocket = socket as AppSocket;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        appSocket.emit('iceCandidate', { sessionId, candidate: event.candidate.toJSON() });
      }
    };

    const onOffer = async (payload: { sessionId: string; sdp: string }) => {
      if (payload.sessionId !== sessionId) return;
      await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      appSocket.emit('answer', { sessionId, sdp: answer.sdp! });
    };

    const onAnswer = async (payload: { sessionId: string; sdp: string }) => {
      if (payload.sessionId !== sessionId) return;
      await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
    };

    const onIceCandidate = async (payload: { sessionId: string; candidate: unknown }) => {
      if (payload.sessionId !== sessionId) return;
      await pc.addIceCandidate(payload.candidate as RTCIceCandidateInit);
    };

    appSocket.on('offer', onOffer);
    appSocket.on('answer', onAnswer);
    appSocket.on('iceCandidate', onIceCandidate);

    if (initiator) {
      pc.createOffer().then(async (offer) => {
        await pc.setLocalDescription(offer);
        appSocket.emit('offer', { sessionId, sdp: offer.sdp! });
      });
    }

    return () => {
      appSocket.off('offer', onOffer);
      appSocket.off('answer', onAnswer);
      appSocket.off('iceCandidate', onIceCandidate);
      pc.close();
      pcRef.current = null;
      setRemoteStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, sessionId, initiator]);

  function replaceTrack(newTrack: MediaStreamTrack) {
    const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === newTrack.kind);
    sender?.replaceTrack(newTrack);
  }

  return { remoteStream, replaceTrack };
}
