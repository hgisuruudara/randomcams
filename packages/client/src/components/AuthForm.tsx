import { useState } from 'react';
import { login, loginWithGoogle, requestPasswordReset, signup } from '../api/rest';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Logo } from './Logo';

export function AuthForm({ onAuthenticated }: { onAuthenticated: (auth: { userId: string; token: string }) => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result =
        mode === 'signup' ? await signup(email, password, displayName, acceptedTerms) : await login(email, password);
      onAuthenticated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setForgotSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleIdToken(idToken: string) {
    setError(null);
    try {
      const result = await loginWithGoogle(idToken, acceptedTerms);
      onAuthenticated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }

  const canSubmit = mode === 'login' || acceptedTerms;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full
          bg-gradient-to-br from-brand-400/30 to-fuchsia-400/20 blur-3xl dark:from-brand-600/20 dark:to-fuchsia-600/10"
      />

      <div className="card relative w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">randomcams</h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Verified. Random. Live.</p>
          </div>
        </div>

        {mode === 'forgot' ? (
          <>
            <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Reset your password</h2>
            {forgotSent ? (
              <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                If an account exists for that email, a reset link has been sent.
              </p>
            ) : (
              <form onSubmit={submitForgot} className="mt-4 space-y-4">
                <div>
                  <label className="label" htmlFor="forgot-email">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  Send reset link
                </button>
              </form>
            )}
            {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
            <button className="btn-ghost mt-4 w-full" onClick={() => setMode('login')}>
              ← Back to log in
            </button>
          </>
        ) : (
          <>
            {/* Segmented tab switcher */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
              <button
                className={`rounded-full py-2 text-sm font-semibold transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-brand-700 shadow dark:bg-slate-700 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
              <button
                className={`rounded-full py-2 text-sm font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-brand-700 shadow dark:bg-slate-700 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                onClick={() => setMode('login')}
              >
                Log in
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="label" htmlFor="displayName">
                    Display name
                  </label>
                  <input
                    id="displayName"
                    className="input"
                    placeholder="Alex"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {mode === 'signup' && (
                <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span>
                    I am 18 or older and agree to the{' '}
                    <a className="link" href="/terms" target="_blank" rel="noreferrer">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a className="link" href="/privacy" target="_blank" rel="noreferrer">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading || !canSubmit}>
                {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
              </button>
            </form>

            {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

            {mode === 'login' && (
              <button className="mt-3 text-xs font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400" onClick={() => setMode('forgot')}>
                Forgot password?
              </button>
            )}

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">or</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            {mode === 'signup' && !acceptedTerms ? (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                Accept the terms above to continue with Google.
              </p>
            ) : (
              <div className="flex justify-center">
                <GoogleSignInButton onIdToken={handleGoogleIdToken} />
              </div>
            )}
          </>
        )}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          Signing up (either way) doesn't make you visible to other users yet — identity verification
          is required before matching. Google sign-in only confirms who you are, not your age or
          gender.
        </p>
      </div>
    </div>
  );
}
