import { useEffect, useState } from 'react';
import { verifyEmail } from '../api/rest';

export function VerifyEmailPage() {
  const [status, setStatus] = useState<'checking' | 'done' | 'error'>('checking');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      return;
    }
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
