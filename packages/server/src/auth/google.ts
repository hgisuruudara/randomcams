import { OAuth2Client } from 'google-auth-library';

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set');
  if (!client) client = new OAuth2Client(clientId);
  return client;
}

export interface GoogleIdentity {
  googleId: string;
  email: string;
  displayName: string;
}

// Verifies the ID token's signature and audience against Google's public
// keys — this is authentication only. It tells you which Google account the
// browser is signed into, nothing about age. Do not use this result to set
// verifiedGender/verifiedBirthdate; that data only ever comes from the KYC
// flow in ../verification.
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  const oAuthClient = getClient();
  const ticket = await oAuthClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Google token payload missing sub or email');
  }
  return {
    googleId: payload.sub,
    email: payload.email,
    displayName: payload.name ?? payload.email,
  };
}
