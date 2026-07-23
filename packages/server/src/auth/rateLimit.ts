import rateLimit from 'express-rate-limit';

// A factory rather than a shared singleton: each call gets its own counter
// store. In production there's only ever one call (from authRouter() at
// startup), so this changes nothing there - it matters for tests, where
// multiple createApp() calls in the same process must not share rate-limit
// state across unrelated test files.
//
// Keyed by IP by default. Behind a real load balancer/proxy, `app.set('trust
// proxy', ...)` needs to be configured correctly or every request will share
// one IP (the proxy's) and this limiter becomes useless or over-broad.
export function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many attempts, try again later' },
  });
}
