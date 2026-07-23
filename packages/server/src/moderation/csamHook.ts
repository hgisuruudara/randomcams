// Automated CSAM detection (PhotoDNA, Thorn Safer, Google CSAI Match, ...) is
// NOT implemented here. It requires:
//   1. A media pipeline that server-side code can actually see frames from —
//      the current signaling layer only relays WebRTC offer/answer/ICE
//      between peers directly (pure P2P), so no server process ever touches
//      the video. That needs to change to an SFU (e.g. LiveKit, mediasoup)
//      before frame sampling is possible at all.
//   2. A signed contract with a classifier vendor and, in most jurisdictions,
//      direct integration with NCMEC's reporting API (or your country's
//      equivalent) — this is a legal reporting channel, not a generic REST
//      API, and misusing/misconfiguring it has real consequences.
//
// Do not treat this file as "the moderation system" — it's a placeholder so
// the rest of the codebase (ModerationReportStatus.ESCALATED_AUTOMATIC) has
// somewhere to plug into once that infrastructure exists. Until then, the
// only CSAM-relevant path in this codebase is the user-reported
// SUSPECTED_MINOR reason in moderation/reports.ts, which triggers an
// immediate protective suspension — that is a stopgap, not a substitute for
// real automated scanning.
export async function scanSessionFrame(_sessionId: string, _frame: Buffer): Promise<void> {
  throw new Error('scanSessionFrame is not implemented — see comment above before calling this.');
}
