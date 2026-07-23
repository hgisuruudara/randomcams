import { useState } from 'react';
import { startVerification } from '../api/rest';

export function VerificationGate({
  userId,
  status,
  onRecheck,
}: {
  userId: string;
  status: string;
  onRecheck: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const { redirectUrl } = await startVerification(userId);
      window.location.href = redirectUrl;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Identity verification required</h2>
      <p>
        This app matches people by verified age and gender, pulled from a government ID during
        onboarding — not from what you type in. Current status: <strong>{status}</strong>
      </p>
      {status === 'rejected' && (
        <p style={{ color: 'crimson' }}>
          Verification was rejected. This can mean the ID didn't confirm you're 18+, or the document
          didn't pass checks. Contact support if you believe this is wrong.
        </p>
      )}
      <button onClick={handleStart} disabled={loading}>
        {loading ? 'Starting…' : 'Start verification'}
      </button>
      <br />
      <br />
      <button onClick={onRecheck}>I've completed verification — recheck status</button>
    </div>
  );
}
