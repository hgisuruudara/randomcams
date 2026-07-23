import express, { Router } from 'express';
import { prisma } from '../db';
import { getKycProvider } from './index';
import { applyVerificationResult } from './applyResult';
import { requireAuth } from '../auth/middleware';

export function verificationRouter(): Router {
  const router = Router();
  const provider = getKycProvider();

  router.post('/start', requireAuth, async (req, res) => {
    const userId = req.userId!;

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

  router.get('/status', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json({ verificationStatus: user.verificationStatus, banned: user.banned });
  });

  // Local-dev-only page: simulates the ID-capture step a real vendor would
  // host, so the verification loop can be exercised end-to-end without a
  // vendor contract. Only meaningful while KYC_PROVIDER=mock.
  router.get('/mock-kyc/:providerReference', (req, res) => {
    const { providerReference } = req.params;
    res.type('html').send(`<!doctype html>
<html>
<head>
<meta name="color-scheme" content="light dark">
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #f5f3ff, #ffffff 60%, #fdf2ff);
    color: #0f172a;
  }
  @media (prefers-color-scheme: dark) {
    body { background: linear-gradient(135deg, #020617, #0f172a 60%, #1e1033); color: #f1f5f9; }
    .card { background: rgba(15, 23, 42, 0.7) !important; border-color: rgba(51, 65, 85, 0.5) !important; }
    button { background: rgba(30, 41, 59, 0.6) !important; color: #e2e8f0 !important; border-color: rgba(71, 85, 105, 0.6) !important; }
    button:hover { border-color: #a78bfa !important; }
    p.muted { color: #94a3b8 !important; }
  }
  .card {
    max-width: 440px; width: 100%; margin: 24px; padding: 32px; border-radius: 24px;
    background: rgba(255,255,255,0.85); border: 1px solid rgba(226,232,240,0.8);
    box-shadow: 0 20px 40px -12px rgba(80, 40, 160, 0.15); backdrop-filter: blur(6px);
  }
  .badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px;
    background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; margin-bottom: 16px;
  }
  h3 { margin: 0 0 8px; font-size: 20px; }
  p { line-height: 1.5; }
  p.muted { color: #64748b; font-size: 14px; }
  button {
    display: block; width: 100%; text-align: left; margin-bottom: 10px; padding: 12px 16px;
    border-radius: 14px; border: 1px solid #e2e8f0; background: #fff; color: #0f172a;
    font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  button:hover { border-color: #7c3aed; box-shadow: 0 4px 12px -4px rgba(124,58,237,0.3); }
  #result { font-size: 13px; margin-top: 16px; word-break: break-all; }
</style>
</head>
<body>
<div class="card">
  <span class="badge">⚠ Mock / dev only</span>
  <h3>Mock identity verification</h3>
  <p class="muted">This page stands in for a real KYC vendor's ID capture + liveness flow. Pick an outcome to simulate:</p>
  <button onclick="submit('MALE')">✅ Simulate verified — Male, age 25</button>
  <button onclick="submit('FEMALE')">✅ Simulate verified — Female, age 25</button>
  <button onclick="submit(null, true)">🚫 Simulate underage (rejected)</button>
  <button onclick="submit(null, false, true)">❌ Simulate rejected (failed ID check)</button>
  <p id="result" class="muted"></p>
</div>
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
