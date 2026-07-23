import { ModerationReportReason as PrismaReason } from '@prisma/client';
import { ModerationReportInput } from '@randomcams/shared';
import { prisma } from '../db';

function toPrismaReason(reason: ModerationReportInput['reason']): PrismaReason {
  switch (reason) {
    case 'nudity_or_sexual_content_without_consent':
      return PrismaReason.NUDITY_OR_SEXUAL_CONTENT_WITHOUT_CONSENT;
    case 'suspected_minor':
      return PrismaReason.SUSPECTED_MINOR;
    case 'harassment':
      return PrismaReason.HARASSMENT;
    case 'scam_or_solicitation':
      return PrismaReason.SCAM_OR_SOLICITATION;
    default:
      return PrismaReason.OTHER;
  }
}

export async function createReport(reporterId: string, input: ModerationReportInput) {
  const reason = toPrismaReason(input.reason);
  const isSuspectedMinor = reason === PrismaReason.SUSPECTED_MINOR;

  const report = await prisma.moderationReport.create({
    data: {
      sessionId: input.sessionId,
      reporterId,
      reportedUserId: input.reportedUserId,
      reason,
      note: input.note,
      // Every other reason sits in a human review queue and does NOT ban
      // anyone automatically, per product policy: reports get manually
      // verified before any account action. SUSPECTED_MINOR is the one
      // exception — it triggers an immediate protective suspension below
      // pending urgent human review, because the cost of leaving a
      // possible-minor's account active while a report sits in a queue is
      // not acceptable. This is a stopgap safety measure, not a substitute
      // for real automated CSAM scanning (see moderation/csamHook.ts).
      status: isSuspectedMinor ? 'ESCALATED_AUTOMATIC' : 'PENDING_REVIEW',
    },
  });

  if (isSuspectedMinor) {
    await prisma.user.update({
      where: { id: input.reportedUserId },
      data: { banned: true, bannedAt: new Date() },
    });
    // TODO: route this to whatever urgent-review process + legal reporting
    // obligation (e.g. NCMEC CyberTipline in the US) your compliance counsel
    // sets up. Do not let this just sit as a DB row.
    // eslint-disable-next-line no-console
    console.warn(`[URGENT] suspected_minor report ${report.id} — reported user auto-suspended pending review`);
  }

  return report;
}
