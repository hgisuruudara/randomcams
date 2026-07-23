import { Router } from 'express';
import { requireAuth } from '../auth/middleware';
import { generateTurnCredentials } from './turnCredentials';

export function webrtcRouter(): Router {
  const router = Router();

  // Requires auth so only signed-in (and, transitively through the rest of
  // the app's gating, verified) users can mint a relay credential - an
  // unauthenticated endpoint here would let anyone use the TURN server as a
  // free open relay.
  router.get('/turn-credentials', requireAuth, (req, res) => {
    const creds = generateTurnCredentials(req.userId!);
    if (!creds) {
      res.status(404).json({ error: 'TURN is not configured on this deployment' });
      return;
    }
    res.json(creds);
  });

  return router;
}
