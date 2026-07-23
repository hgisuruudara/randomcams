// Bump whenever the Terms of Service or Privacy Policy change in a way that
// should require existing users to re-accept. The server stamps this value
// itself on signup (never trusts a client-supplied version) - it's exported
// here only so the client can display "you're agreeing to version X" text
// that actually matches what the server will record.
export const CURRENT_TOS_VERSION = '2026-07-23';

// Gender here means the legal sex marker extracted from a verified government ID
// during KYC, not self-reported gender. See VerificationStatus — filtering only
// applies once a user reaches 'verified'.
export type VerifiedGender = 'male' | 'female';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface PublicUser {
  id: string;
  displayName: string;
  verificationStatus: VerificationStatus;
  verifiedGender: VerifiedGender | null;
}

export interface MatchPreferences {
  seekingGenders: VerifiedGender[];
}

export type ModerationReportReason =
  | 'nudity_or_sexual_content_without_consent'
  | 'suspected_minor'
  | 'harassment'
  | 'scam_or_solicitation'
  | 'other';

export interface ModerationReportInput {
  sessionId: string;
  reportedUserId: string;
  reason: ModerationReportReason;
  note?: string;
}

// --- Socket.IO signaling event contracts ---

export interface ServerToClientEvents {
  waitingForMatch: () => void;
  matched: (payload: { sessionId: string; peer: PublicUser; initiator: boolean }) => void;
  offer: (payload: { sessionId: string; sdp: string }) => void;
  answer: (payload: { sessionId: string; sdp: string }) => void;
  iceCandidate: (payload: { sessionId: string; candidate: unknown }) => void;
  peerLeft: (payload: { sessionId: string }) => void;
  verificationRequired: () => void;
  reportAcknowledged: (payload: { reportId: string }) => void;
  errorMessage: (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  joinQueue: (preferences: MatchPreferences) => void;
  leaveQueue: () => void;
  offer: (payload: { sessionId: string; sdp: string }) => void;
  answer: (payload: { sessionId: string; sdp: string }) => void;
  iceCandidate: (payload: { sessionId: string; candidate: unknown }) => void;
  leaveSession: (payload: { sessionId: string }) => void;
  report: (payload: ModerationReportInput) => void;
}
