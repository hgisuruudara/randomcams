import { useEffect, useRef } from 'react';
import { useTheme } from '../theme';

// Minimal shape of the Google Identity Services API we use. Loaded via the
// script tag below rather than an npm package, since it's just a thin
// wrapper over a script Google hosts.
interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: { credential: string }) => void;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (parent: HTMLElement, options: { theme: string; size: string }) => void;
        };
      };
    };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('failed to load Google sign-in script'));
    document.body.appendChild(script);
  });
}

export function GoogleSignInButton({ onIdToken }: { onIdToken: (idToken: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const { isDark } = useTheme();

  useEffect(() => {
    if (!clientId || !containerRef.current) return;
    let cancelled = false;

    loadGoogleScript().then(() => {
      if (cancelled || !window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onIdToken(response.credential),
      });
      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
      });
    });

    return () => {
      cancelled = true;
    };
  }, [clientId, onIdToken, isDark]);

  if (!clientId) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Google sign-in isn't configured (set VITE_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return <div ref={containerRef} />;
}
