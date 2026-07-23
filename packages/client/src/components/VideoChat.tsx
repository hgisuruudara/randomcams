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
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-slate-900 shadow-xl shadow-slate-900/20 dark:shadow-black/40">
      <video ref={remoteRef} autoPlay playsInline className="h-full w-full object-cover" />
      {!remoteStream && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          Connecting video…
        </div>
      )}
      <div className="absolute bottom-3 right-3 h-24 w-36 overflow-hidden rounded-2xl border-2 border-white/80 bg-slate-800 shadow-lg sm:h-28 sm:w-44 dark:border-slate-700">
        <video ref={localRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
