import { randomUUID } from 'crypto';
import { KycProvider, KycVerificationResult, StartVerificationResult } from './provider';

// Local-development stand-in only. It never verifies a real document — it
// exists so the rest of the system (matching, gating, webhook handling) can
// be built and tested before a real vendor contract is in place. Must not be
// selected in any deployed environment (see KYC_PROVIDER in .env).
export class MockKycProvider implements KycProvider {
  readonly name = 'mock';

  async startVerification(userId: string): Promise<StartVerificationResult> {
    const providerReference = `mock_${randomUUID()}`;
    return {
      providerReference,
      redirectUrl: `http://localhost:4000/mock-kyc/${providerReference}?userId=${userId}`,
    };
  }

  parseWebhookPayload(rawBody: Buffer): KycVerificationResult {
    const payload = JSON.parse(rawBody.toString('utf-8'));
    return {
      providerReference: payload.providerReference,
      status: payload.status,
      extractedGender: payload.extractedGender,
      extractedBirthdate: payload.extractedBirthdate ? new Date(payload.extractedBirthdate) : undefined,
    };
  }
}
