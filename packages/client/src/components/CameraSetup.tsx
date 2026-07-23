import { useEffect, useRef } from 'react';
import { UseMediaDevicesReturn } from '../hooks/useMediaDevices';

export function CameraSetup({ media }: { media: UseMediaDevicesReturn }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = media.stream;
  }, [media.stream]);

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-video w-full bg-slate-900">
        {media.cameraOn ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-slate-500">
              <path
                d="M15 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-3.5l4 3.5v-11l-4 3.5z"
                fill="currentColor"
                opacity="0.5"
              />
              <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-slate-300">Camera is off</p>
            <button onClick={media.enableCamera} className="btn-primary">
              Enable camera &amp; microphone
            </button>
            {media.error && <p className="max-w-xs text-xs text-rose-400">{media.error}</p>}
          </div>
        )}

        {media.cameraOn && (
          <button
            onClick={media.toggleMute}
            aria-label={media.muted ? 'Unmute microphone' : 'Mute microphone'}
            className={`absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-colors ${
              media.muted ? 'bg-rose-600 text-white' : 'bg-black/50 text-white hover:bg-black/70'
            }`}
          >
            {media.muted ? <MicOffIcon /> : <MicOnIcon />}
          </button>
        )}

        {media.cameraOn && media.videoDevices.length > 1 && (
          <button
            onClick={() => media.cycleCamera()}
            aria-label="Switch camera"
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <FlipIcon />
          </button>
        )}
      </div>

      {media.cameraOn && (
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          {media.videoDevices.length > 1 && (
            <select
              value={media.videoDeviceId ?? ''}
              onChange={(e) => media.switchVideoDevice(e.target.value)}
              className="input !py-2 text-xs"
            >
              {media.videoDevices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}
          {media.audioDevices.length > 1 && (
            <select
              value={media.audioDeviceId ?? ''}
              onChange={(e) => media.switchAudioDevice(e.target.value)}
              className="input !py-2 text-xs"
            >
              {media.audioDevices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>
          )}
          <button onClick={media.disableCamera} className="btn-secondary shrink-0 !py-2 text-xs">
            Turn off camera
          </button>
        </div>
      )}
    </div>
  );
}

function MicOnIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" />
      <path d="M17 11a1 1 0 10-2 0 3 3 0 01-6 0 1 1 0 10-2 0 5 5 0 004 4.9V18h-2a1 1 0 100 2h6a1 1 0 100-2h-2v-2.1a5 5 0 004-4.9z" />
    </svg>
  );
}
function MicOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M19 11a1 1 0 10-2 0 4.98 4.98 0 01-.86 2.81l1.45 1.45A6.97 6.97 0 0019 11z" />
      <path d="M15 11V6a3 3 0 00-5.91-.77l1.45 1.45A1 1 0 0112 6a1 1 0 011 1v4a1 1 0 01-.02.2l1.47 1.47A3 3 0 0015 11z" />
      <path d="M3.7 2.3a1 1 0 00-1.4 1.4l4.02 4.02V11a3 3 0 003.92 2.85l1.3 1.3A5 5 0 017 11a1 1 0 10-2 0 7 7 0 006 6.92V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.08a6.96 6.96 0 003.4-1.32l2.3 2.3a1 1 0 001.4-1.42L3.7 2.3z" />
    </svg>
  );
}
function FlipIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 3l3 3m0 0l-3 3m3-3H8a5 5 0 00-5 5m2 8l-3-3m0 0l3-3m-3 3h13a5 5 0 005-5"
      />
    </svg>
  );
}
