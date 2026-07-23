import { useState } from 'react';
import { resetPassword } from '../api/rest';
import { TOKEN_STORAGE_KEY } from '../tokenStorage';

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
      <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
        <p>This link is missing its reset token. Request a new one from the login screen.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
        <p>Password updated. Redirecting…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h2>Set a new password</h2>
      <form onSubmit={submit}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
        <br />
        <button type="submit">Set new password</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <p style={{ fontSize: 12, color: '#666' }}>
        This will log you out of every other device using this account.
      </p>
    </div>
  );
}
