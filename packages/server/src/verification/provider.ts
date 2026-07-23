export type RawVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface KycVerificationResult {
  providerReference: string;
  status: RawVerificationStatus;
  extractedGender?: 'MALE' | 'FEMALE';
  extractedBirthdate?: Date;
}

export interface StartVerificationResult {
  providerReference: string;
  // Where the client should send the user to complete ID capture/liveness.
  redirectUrl: string;
}

// Implement this against a real identity-verification vendor (Veriff, Persona,
// Yoti, AU10TIX, ...) before going anywhere near production. The vendor must
// perform actual document + liveness verification and return the legal sex
// marker from the ID plus date of birth — self-report of either field is not
// acceptable for this product's trust model.
export interface KycProvider {
  readonly name: string;
  startVerification(userId: string): Promise<StartVerificationResult>;
  parseWebhookPayload(rawBody: Buffer, signatureHeader: string | undefined): KycVerificationResult;
}
