import express, { Router } from 'express';
import { prisma } from '../db';
import { getKycProvider } from './index';
import { applyVerificationResult } from './applyResult';

export function verificationRouter(): Router {
  const router = Router();
  const provider = getKycProvider();

  // In a real deployment, userId comes from an authenticated session, not the
  // request body — this scaffold has no auth layer yet.
  router.post('/start', express.json(), async (req, res) => {
    const { userId } = req.body as { userId?: string };
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const { providerReference, redirectUrl } = await provider.startVerification(userId);

    await prisma.verificationRecord.create({
      data: {
        userId,
        provider: provider.name,
        providerReference,
        status: 'PENDING',
      },
    });
    await prisma.user.update({ where: { id: userId }, data: { verificationStatus: 'PENDING' } });

    res.json({ redirectUrl });
  });

  router.get('/status/:userId', async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json({ verificationStatus: user.verificationStatus, banned: user.banned });
  });

  // Local-dev-only page: simulates the ID-capture step a real vendor would
  // host, so the verification loop can be exercised end-to-end without a
  // vendor contract. Only meaningful while KYC_PROVIDER=mock.
  router.get('/mock-kyc/:providerReference', (req, res) => {
    const { providerReference } = req.params;
    res.type('html').send(`<!doctype html>
<html><body style="font-family: sans-serif; max-width: 480px; margin: 40px auto;">
<h3>Mock identity verification</h3>
<p>This page stands in for a real KYC vendor's ID capture + liveness flow. Pick an outcome to simulate:</p>
<button onclick="submit('MALE')">Simulate verified — Male, age 25</button><br /><br />
<button onclick="submit('FEMALE')">Simulate verified — Female, age 25</button><br /><br />
<button onclick="submit(null, true)">Simulate underage (rejected)</button><br /><br />
<button onclick="submit(null, false, true)">Simulate rejected (failed ID check)</button>
<p id="result"></p>
<script>
  async function submit(gender, underage, rejected) {
    const body = underage
      ? { providerReference: '${providerReference}', status: 'rejected', extractedBirthdate: '2015-01-01' }
      : rejected
      ? { providerReference: '${providerReference}', status: 'rejected' }
      : { providerReference: '${providerReference}', status: 'verified', extractedGender: gender, extractedBirthdate: '2000-01-01' };
    const res = await fetch('/verification/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    document.getElementById('result').innerText = 'Result: ' + JSON.stringify(json);
  }
</script>
</body></html>`);
  });

  // Real vendors sign this payload (e.g. HMAC header) — parseWebhookPayload is
  // where that signature must be checked before trusting the body. The mock
  // provider skips signature checking entirely; do not model a real
  // integration on it.
  router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.header('x-kyc-signature');

    let result;
    try {
      result = provider.parseWebhookPayload(req.body as Buffer, signature);
    } catch {
      return res.status(400).json({ error: 'invalid webhook payload' });
    }

    const record = await prisma.verificationRecord.findFirst({
      where: { providerReference: result.providerReference },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) {
      return res.status(404).json({ error: 'unknown providerReference' });
    }

    const status = await applyVerificationResult(record.userId, result);
    res.json({ status });
  });

  return router;
}
