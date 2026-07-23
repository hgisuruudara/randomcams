const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

export async function getVerificationStatus(userId: string) {
  const res = await fetch(`${SERVER_URL}/verification/status/${userId}`);
  if (!res.ok) throw new Error('failed to fetch verification status');
  return res.json() as Promise<{ verificationStatus: string; banned: boolean }>;
}

export async function startVerification(userId: string) {
  const res = await fetch(`${SERVER_URL}/verification/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('failed to start verification');
  return res.json() as Promise<{ redirectUrl: string }>;
}
