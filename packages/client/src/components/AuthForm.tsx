import { useState } from 'react';
import { login, loginWithGoogle, signup } from '../api/rest';
import { GoogleSignInButton } from './GoogleSignInButton';

export function AuthForm({ onAuthenticated }: { onAuthenticated: (auth: { userId: string; token: string }) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = mode === 'signup' ? await signup(email, password, displayName) : await login(email, password);
      onAuthenticated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleIdToken(idToken: string) {
    setError(null);
    try {
      const result = await loginWithGoogle(idToken);
      onAuthenticated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h2>randomcams</h2>
      <form onSubmit={submit}>
        {mode === 'signup' && (
          <>
            <input
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <br />
          </>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <br />
        <button type="submit" disabled={loading}>
          {mode === 'signup' ? 'Sign up' : 'Log in'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
        {mode === 'signup' ? 'Already have an account? Log in' : "Need an account? Sign up"}
      </button>

      <p style={{ textAlign: 'center', margin: '16px 0' }}>or</p>
      <GoogleSignInButton onIdToken={handleGoogleIdToken} />

      <p style={{ fontSize: 12, color: '#666' }}>
        Signing up (either way) does not make you visible to other users yet — identity verification
        is required before matching. Google sign-in only confirms who you are, not your age or
        gender.
      </p>
    </div>
  );
}
