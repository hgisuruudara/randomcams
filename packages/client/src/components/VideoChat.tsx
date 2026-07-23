import { useEffect, useRef } from 'react';

export function VideoChat({
  localStream,
  remoteStream,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <video ref={remoteRef} autoPlay playsInline style={{ width: 480, background: '#000' }} />
      <video ref={localRef} autoPlay playsInline muted style={{ width: 160, background: '#000' }} />
    </div>
  );
}
