import { useEffect, useState } from 'react';
import { getTurnCredentials } from '../api/rest';

const STUN_ONLY: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

// Time-limited TURN credentials (see server's src/webrtc/turnCredentials.ts)
// are fetched fresh per session rather than baked into the client build, so
// a credential visible in chrome://webrtc-internals expires on its own
// instead of working forever. Refetches a little before the server-issued
// TTL to avoid a credential expiring mid-wait in the matching queue.
export function useIceServers(token: string | null) {
  const [iceServers, setIceServers] = useState<RTCIceServer[]>(STUN_ONLY);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function refresh() {
      try {
        const creds = await getTurnCredentials(token!);
        if (cancelled) return;
        if (creds) {
          setIceServers([
            ...STUN_ONLY,
            { urls: creds.urls, username: creds.username, credential: creds.credential },
          ]);
          const refreshInMs = Math.max(creds.ttlSeconds - 60, 30) * 1000;
          timer = setTimeout(refresh, refreshInMs);
        } else {
          setIceServers(STUN_ONLY);
        }
      } catch {
        setIceServers(STUN_ONLY);
      }
    }

    refresh();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  return iceServers;
}
