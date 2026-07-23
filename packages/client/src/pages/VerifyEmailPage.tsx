import { useEffect, useState } from 'react';
import { verifyEmail } from '../api/rest';
import { Logo } from '../components/Logo';

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
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>

        {status === 'checking' && <p className="text-sm text-slate-500 dark:text-slate-400">Verifying…</p>}

        {status === 'done' && (
          <>
            <div className="mb-2 flex justify-center">
              <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Email verified
              </span>
            </div>
            <a href="/" className="link mt-2 inline-block text-sm">
              Continue →
            </a>
          </>
        )}

        {status === 'error' && (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            This verification link is invalid or expired. You can keep using your account either way —
            this only confirms your email address, it isn't required to match with anyone.
          </p>
        )}
      </div>
    </div>
  );
}
