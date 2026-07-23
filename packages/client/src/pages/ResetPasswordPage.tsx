import { useState } from 'react';
import { resetPassword } from '../api/rest';
import { TOKEN_STORAGE_KEY } from '../tokenStorage';
import { Logo } from '../components/Logo';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Missing or invalid reset link.');
      return;
    }
    try {
      const result = await resetPassword(token, newPassword);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      setDone(true);
      setTimeout(() => window.location.assign('/'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'reset failed');
    }
  }

  if (!token) {
    return (
      <Shell>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This link is missing its reset token. Request a new one from the login screen.
        </p>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Password updated. Redirecting…
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-lg font-bold text-slate-900 dark:text-white">Set a new password</h1>
      <form onSubmit={submit} className="mt-5 space-y-4 text-left">
        <div>
          <label className="label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            className="input"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Set new password
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        This will log you out of every other device using this account.
      </p>
    </Shell>
  );
}
