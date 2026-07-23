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
