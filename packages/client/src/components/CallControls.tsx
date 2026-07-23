import { UseMediaDevicesReturn } from '../hooks/useMediaDevices';

// Deliberately does NOT offer a "turn camera off" control - camera must
// stay on for the duration of a matched session (see App.tsx's join gate).
// Mic mute and camera switching remain available throughout.
export function CallControls({
  media,
  onReplaceVideoTrack,
}: {
  media: UseMediaDevicesReturn;
  onReplaceVideoTrack: (track: MediaStreamTrack) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={media.toggleMute}
        className={`btn-secondary !px-4 !py-2 text-xs ${media.muted ? '!bg-rose-100 !text-rose-700 dark:!bg-rose-500/10 dark:!text-rose-300' : ''}`}
      >
        {media.muted ? '🔇 Unmute' : '🎙️ Mute'}
      </button>
      {media.videoDevices.length > 1 && (
        <button onClick={() => media.cycleCamera(onReplaceVideoTrack)} className="btn-secondary !px-4 !py-2 text-xs">
          🔄 Flip camera
        </button>
      )}
    </div>
  );
}
