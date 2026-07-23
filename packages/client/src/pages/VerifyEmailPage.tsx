import { useEffect, useState } from 'react';
import { verifyEmail } from '../api/rest';

// Module-scoped rather than a ref: the verification token is single-use
// server-side, so React StrictMode's dev-only double-invoke of this effect
// would otherwise fire the request twice - the second call always fails
// (token already consumed), and whichever response resolves last would win,
// sometimes showing "invalid" even though verification actually succeeded.
const attemptedTokens = new Set<string>();

export function VerifyEmailPage() {
  const [status, setStatus] = useState<'checking' | 'done' | 'error'>('checking');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    if (attemptedTokens.has(token)) return;
    attemptedTokens.add(token);

    verifyEmail(token)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
      {status === 'checking' && <p>Verifying…</p>}
      {status === 'done' && (
        <>
          <p>Email verified.</p>
          <a href="/">Continue</a>
        </>
      )}
      {status === 'error' && (
        <p style={{ color: 'crimson' }}>
          This verification link is invalid or expired. You can keep using your account either way -
          this only confirms your email address, it isn't required to match with anyone.
        </p>
      )}
    </div>
  );
}
