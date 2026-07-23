import { useState } from 'react';
import { startVerification } from '../api/rest';
import { Logo } from './Logo';

const STATUS_STYLES: Record<string, string> = {
  unverified: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

export function VerificationGate({
  token,
  status,
  onRecheck,
}: {
  token: string;
  status: string;
  onRecheck: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const { redirectUrl } = await startVerification(token);
      window.location.href = redirectUrl;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Identity verification required</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          This app matches people by verified age and gender, pulled from a government ID during
          onboarding — not from what you type in.
        </p>

        <div className="mt-4 flex justify-center">
          <span className={`badge ${STATUS_STYLES[status] ?? STATUS_STYLES.unverified}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
          </span>
        </div>

        {status === 'rejected' && (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-left text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            Verification was rejected. This can mean the ID didn't confirm you're 18+, or the
            document didn't pass checks. Contact support if you believe this is wrong.
          </p>
        )}

        <button onClick={handleStart} disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? 'Starting…' : 'Start verification'}
        </button>
        <button onClick={onRecheck} className="btn-ghost mt-2 w-full">
          I've completed verification — recheck status
        </button>
      </div>
    </div>
  );
}
