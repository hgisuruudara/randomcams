import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@randomcams/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Public STUN only. Production needs a TURN server (e.g. coturn) too, since a
// large fraction of real-world connections sit behind NATs/firewalls that
// STUN alone can't traverse.
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

export function useWebRTC(socket: Socket | null, sessionId: string | null, initiator: boolean) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (!cancelled) setLocalStream(stream);
    });
    return () => {
      cancelled = true;
      setLocalStream((s) => {
        s?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, []);

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
  }, [socket, sessionId, initiator, localStream]);

  return { localStream, remoteStream };
}
