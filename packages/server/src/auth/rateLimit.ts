import rateLimit from 'express-rate-limit';

// Keyed by IP by default. Behind a real load balancer/proxy, `app.set('trust
// proxy', ...)` needs to be configured correctly or every request will share
// one IP (the proxy's) and this limiter becomes useless or over-broad.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many attempts, try again later' },
});
