import express, { Router } from 'express';
import { prisma } from '../db';

// No admin authentication/authorization is wired up yet — this is a scaffold.
// Before this is reachable from anywhere but localhost, put it behind real
// staff auth (not the same session auth as regular users).
export function moderationAdminRouter(): Router {
  const router = Router();

  router.get('/reports', async (req, res) => {
    const status = (req.query.status as string | undefined) ?? 'PENDING_REVIEW';
    const userSummary = {
      id: true,
      email: true,
      displayName: true,
      banned: true,
      verificationStatus: true,
      verifiedGender: true,
    } as const;

    const reports = await prisma.moderationReport.findMany({
      where: { status: status as never },
      orderBy: { createdAt: 'asc' },
      include: { reportedUser: { select: userSummary }, reporter: { select: userSummary } },
    });
    res.json(reports);
  });

  // Human-in-the-loop resolution: an admin looks at the evidence and decides.
  // This is the manual-verification step — reported accounts are never
  // banned automatically off a single user report (aside from the
  // suspected_minor protective-suspension path, which is handled separately
  // in moderation/reports.ts).
  router.post('/reports/:id/resolve', express.json(), async (req, res) => {
    const { id } = req.params;
    const { action, adminId } = req.body as { action: 'ACTION_TAKEN' | 'DISMISSED'; adminId: string };

    const report = await prisma.moderationReport.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ error: 'report not found' });

    await prisma.moderationReport.update({
      where: { id },
      data: { status: action, reviewedByAdminId: adminId, reviewedAt: new Date() },
    });

    if (action === 'ACTION_TAKEN') {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { banned: true, bannedAt: new Date() },
      });
    }

    res.json({ ok: true });
  });

  return router;
}
