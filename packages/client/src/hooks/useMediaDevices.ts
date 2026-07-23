import { useCallback, useEffect, useRef, useState } from 'react';

export interface MediaDevicesState {
  stream: MediaStream | null;
  cameraOn: boolean;
  muted: boolean;
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  videoDeviceId: string | null;
  audioDeviceId: string | null;
  error: string | null;
}

type ReplaceTrackHandler = (track: MediaStreamTrack) => void;

// Owns the single MediaStream for the whole session (lobby preview through
// an active call). Camera/mic swaps mutate this same stream's tracks in
// place (removeTrack/addTrack) rather than creating a new MediaStream, so
// any <video> already bound to it keeps playing without re-attaching -
// and, when mid-call, the caller can pass an onReplace callback to push the
// new track into the live RTCPeerConnection via replaceTrack(), avoiding a
// full renegotiation just to switch cameras.
export function useMediaDevices() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState<string | null>(null);
  const [audioDeviceId, setAudioDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refreshDevices = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
    setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
  }, []);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', refreshDevices);
  }, [refreshDevices]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function enableCamera() {
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
      });
      streamRef.current = newStream;
      setStream(newStream);
      setCameraOn(true);
      setMuted(false);
      await refreshDevices();
      setVideoDeviceId(newStream.getVideoTracks()[0]?.getSettings().deviceId ?? null);
      setAudioDeviceId(newStream.getAudioTracks()[0]?.getSettings().deviceId ?? null);
    } catch {
      setError('Camera and microphone access is required to use randomcams.');
    }
  }

  function disableCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    setCameraOn(false);
  }

  function toggleMute() {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }

  async function switchVideoDevice(deviceId: string, onReplace?: ReplaceTrackHandler) {
    const current = streamRef.current;
    if (!current) return;
    try {
      const replacement = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
      const newTrack = replacement.getVideoTracks()[0];
      const oldTrack = current.getVideoTracks()[0];
      if (oldTrack) {
        current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      current.addTrack(newTrack);
      setVideoDeviceId(deviceId);
      onReplace?.(newTrack);
    } catch {
      setError('Could not switch camera.');
    }
  }

  async function switchAudioDevice(deviceId: string, onReplace?: ReplaceTrackHandler) {
    const current = streamRef.current;
    if (!current) return;
    try {
      const replacement = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
      const newTrack = replacement.getAudioTracks()[0];
      newTrack.enabled = !muted;
      const oldTrack = current.getAudioTracks()[0];
      if (oldTrack) {
        current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      current.addTrack(newTrack);
      setAudioDeviceId(deviceId);
      onReplace?.(newTrack);
    } catch {
      setError('Could not switch microphone.');
    }
  }

  function cycleCamera(onReplace?: ReplaceTrackHandler) {
    if (videoDevices.length < 2) return;
    const idx = videoDevices.findIndex((d) => d.deviceId === videoDeviceId);
    const next = videoDevices[(idx + 1) % videoDevices.length];
    void switchVideoDevice(next.deviceId, onReplace);
  }

  return {
    stream,
    cameraOn,
    muted,
    videoDevices,
    audioDevices,
    videoDeviceId,
    audioDeviceId,
    error,
    enableCamera,
    disableCamera,
    toggleMute,
    switchVideoDevice,
    switchAudioDevice,
    cycleCamera,
  };
}

export type UseMediaDevicesReturn = ReturnType<typeof useMediaDevices>;
