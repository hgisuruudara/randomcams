const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function signup(email: string, password: string, displayName: string, acceptedTerms: boolean) {
  const res = await fetch(`${SERVER_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, acceptedTerms }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'signup failed');
  return body as { userId: string; token: string };
}

export async function login(email: string, password: string) {
  const res = await fetch(`${SERVER_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'login failed');
  return body as { userId: string; token: string };
}

export async function loginWithGoogle(idToken: string, acceptedTerms: boolean) {
  const res = await fetch(`${SERVER_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, acceptedTerms }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Google sign-in failed');
  return body as { userId: string; token: string };
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${SERVER_URL}/auth/request-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'request failed');
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${SERVER_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'reset failed');
  return body as { userId: string; token: string };
}

export async function verifyEmail(token: string) {
  const res = await fetch(`${SERVER_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'verification failed');
}

export async function logoutEverywhere(token: string) {
  const res = await fetch(`${SERVER_URL}/auth/logout-everywhere`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'failed to log out everywhere');
}

export async function getVerificationStatus(token: string) {
  const res = await fetch(`${SERVER_URL}/verification/status`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('failed to fetch verification status');
  return res.json() as Promise<{ verificationStatus: string; banned: boolean }>;
}

export async function startVerification(token: string) {
  const res = await fetch(`${SERVER_URL}/verification/start`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('failed to start verification');
  return res.json() as Promise<{ redirectUrl: string }>;
}

export interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
  ttlSeconds: number;
}

// Returns null when the server has no TURN_SECRET/TURN_URLS configured
// (e.g. plain local dev) so callers can fall back to STUN-only.
export async function getTurnCredentials(token: string): Promise<TurnCredentials | null> {
  const res = await fetch(`${SERVER_URL}/webrtc/turn-credentials`, { headers: authHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('failed to fetch TURN credentials');
  return res.json();
}

export interface ReportUserSummary {
  id: string;
  email: string;
  displayName: string;
  banned: boolean;
  verificationStatus: string;
  verifiedGender: string | null;
}

export interface ModerationReportView {
  id: string;
  sessionId: string;
  reason: string;
  note: string | null;
  status: string;
  createdAt: string;
  reporter: ReportUserSummary;
  reportedUser: ReportUserSummary;
}

function adminHeaders(adminToken: string) {
  return { 'x-admin-token': adminToken };
}

export async function listPendingReports(adminToken: string) {
  const res = await fetch(`${SERVER_URL}/admin/moderation/reports?status=PENDING_REVIEW`, {
    headers: adminHeaders(adminToken),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'failed to load reports');
  return res.json() as Promise<ModerationReportView[]>;
}

export async function resolveReport(
  adminToken: string,
  reportId: string,
  action: 'ACTION_TAKEN' | 'DISMISSED',
  reviewerLabel?: string
) {
  const res = await fetch(`${SERVER_URL}/admin/moderation/reports/${reportId}/resolve`, {
    method: 'POST',
    headers: { ...adminHeaders(adminToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reviewerLabel }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'failed to resolve report');
}
