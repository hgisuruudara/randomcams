# randomcams

A random-matching video chat app (an OmeTV/Chatroulette-style product), built around one
non-negotiable design principle:

> **Gender and age used for matching come only from verified identity data (KYC), never from
> self-report.** Reports of nudity/abuse go into a human-review queue and do **not** auto-ban
> anyone — except reports claiming a user may be a minor, which trigger an immediate protective
> suspension pending urgent review, because that risk can't wait in a queue.

This document covers how the system is put together, how to run it locally, and what's
deliberately left unfinished with notes on why.

## Contents

- [Architecture](#architecture)
- [Safety & compliance model](#safety--compliance-model)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Trying it out end-to-end](#trying-it-out-end-to-end)
- [Environment variables](#environment-variables)
- [Google Sign-In setup](#google-sign-in-setup)
- [TURN server](#turn-server)
- [Admin moderation panel](#admin-moderation-panel)
- [Automated tests & CI](#automated-tests--ci)
- [Production deployment](#production-deployment)
- [Branching](#branching)
- [Production readiness checklist](#production-readiness-checklist)

## Architecture

Monorepo with three npm workspaces:

```
packages/
  shared/   Types + Socket.IO event contracts shared between server and client
  server/   Express + Socket.IO, Prisma/Postgres, Redis matching queue
  client/   React + Vite, WebRTC
```

Request/data flow:

1. **Auth** (`server/src/auth`) — email/password or Google Sign-In. Issues a JWT. Google
   Sign-In authenticates only; it never sets verified gender/age.
2. **Verification** (`server/src/verification`) — a pluggable KYC provider interface. Ships
   with a `mock` provider (a local page that simulates a vendor's ID-capture flow) so the rest
   of the system is buildable/testable without a real vendor contract. A real integration
   (Veriff/Persona/Yoti/AU10TIX/...) is a per-vendor implementation of the same interface.
3. **Matching** (`server/src/matching`) — a Redis-backed queue. Only verified users (with a
   `verifiedGender` from KYC) ever enter it; pairing requires each side's `seekingGenders` to
   include the other's verified gender.
4. **Signaling** (`server/src/signaling`) — Socket.IO relays WebRTC offer/answer/ICE between
   matched peers. The media itself is peer-to-peer (no server-side video pipeline yet — see the
   [checklist](#production-readiness-checklist) on what that limits).
5. **Moderation** (`server/src/moderation`) — reports land in `PENDING_REVIEW` by default.
   `/admin/moderation` (gated by a shared admin token) is where a human resolves them.

## Safety & compliance model

- **Age/gender is never self-reported.** `User.verifiedGender` / `verifiedBirthdate` are only
  ever written by `verification/applyResult.ts`, after a KYC provider confirms them from a
  document. There's also a defense-in-depth check there: even if a vendor says "verified," a
  birthdate implying under-18 forces the result to `REJECTED` anyway.
- **Reports don't auto-ban.** `moderation/reports.ts` puts everything in `PENDING_REVIEW` except
  `suspected_minor`, which auto-suspends the reported account immediately (pending urgent human
  review) because that specific risk is not one to leave queued.
- **Automated CSAM scanning is NOT implemented.** See `server/src/moderation/csamHook.ts` for
  why: it requires migrating from peer-to-peer WebRTC to an SFU (so a server process can see
  frames at all) plus a real vendor contract (PhotoDNA/Thorn Safer/Google CSAI Match) and, in
  most jurisdictions, direct integration with a legal reporting channel (e.g. NCMEC's
  CyberTipline in the US). Don't treat this codebase as having that coverage — it doesn't yet.
- **Admin access is a stopgap.** `/admin/moderation` is gated by a single shared `ADMIN_TOKEN`,
  not per-admin accounts with an audit trail tied to real identities. Fine for a couple of
  trusted people during early development; replace before that stops being true.

## Prerequisites

- Node.js 20+
- Docker (for Postgres/Redis locally), or local installs of Postgres 16 and Redis 7

## Local setup

```bash
git clone <repo-url>
cd randomcams
git checkout dev_izzy

npm install

# Postgres + Redis (add coturn too if you want to test real TURN relay - see below)
docker compose up -d postgres redis

cp packages/server/.env.example packages/server/.env
cp packages/client/.env.example packages/client/.env
# edit packages/server/.env: at minimum set JWT_SECRET and ADMIN_TOKEN to your own
# random values (`openssl rand -hex 32`), everything else has sane local defaults

cd packages/server
npx prisma migrate deploy
cd ../..

npm run dev:server    # http://localhost:4000
npm run dev:client    # http://localhost:5173
```

If you don't have Docker, install Postgres/Redis locally and point `DATABASE_URL`/`REDIS_URL`
in `packages/server/.env` at them instead.

## Trying it out end-to-end

1. Open `http://localhost:5173` in two separate browser profiles/tabs with camera access (e.g.
   one normal window, one incognito).
2. Sign up two different accounts (different emails), one you'll verify as female, one as male.
3. Each account hits the verification gate. Click "Start verification" — with
   `KYC_PROVIDER=mock` (the default), this opens a local page standing in for a real vendor's ID
   capture. Pick "Simulate verified — Female/Male, age 25" for each account.
4. Recheck status on each tab; both should flip to verified and land on the matching screen.
5. Pick "Show me: Men" on one, "Show me: Women" on the other, and click Start on both — they
   should match and connect over WebRTC.
6. Try the report button on one side, choosing a reason. It's now sitting in `PENDING_REVIEW` —
   the reported user is untouched.
7. Go to `http://localhost:5173/admin`, enter your `ADMIN_TOKEN`, and you'll see that report.
   Take action or dismiss it.

To test the "suspected minor" path, pick "Simulate underage (rejected)" during verification and
confirm the account lands in `REJECTED`, not `VERIFIED` — this is the defense-in-depth check
described above, since the mock provider still claims `status: verified` under the hood but with
an underage birthdate.

## Environment variables

### `packages/server/.env`

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 4000) |
| `CLIENT_ORIGIN` | Allowed CORS origin for the client |
| `JWT_SECRET` | Signs session tokens. Generate a real random value; never reuse the placeholder. |
| `ADMIN_TOKEN` | Shared secret gating `/admin/moderation/*`. Leave unset to disable the admin API entirely (returns 503). |
| `GOOGLE_CLIENT_ID` | OAuth Client ID for Google Sign-In verification. See [below](#google-sign-in-setup). |
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string |
| `KYC_PROVIDER` | `mock` for local dev. See `src/verification/provider.ts` for what a real provider needs to implement. |
| `KYC_API_KEY` / `KYC_WEBHOOK_SECRET` | Placeholders for a real vendor integration; unused by the mock provider. |

### `packages/client/.env`

| Variable | Purpose |
|---|---|
| `VITE_SERVER_URL` | Where the client points its API/WebSocket calls |
| `VITE_GOOGLE_CLIENT_ID` | Must match the server's `GOOGLE_CLIENT_ID` |
| `VITE_TURN_URL` / `VITE_TURN_USERNAME` / `VITE_TURN_CREDENTIAL` | Optional TURN server for WebRTC. See [TURN server](#turn-server). |

## Google Sign-In setup

1. Create an OAuth 2.0 Client ID at the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (Application type: **Web application**).
2. Add your client's origin (e.g. `http://localhost:5173`) under Authorized JavaScript origins.
3. Set the same Client ID as `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (client).
4. Restart both dev servers.

Google Sign-In only authenticates the user — it does not set `verifiedGender`/`verifiedBirthdate`.
Every account, however it was created, still has to pass the KYC flow before it can match.

## TURN server

Two browser tabs on the same machine connect fine over public STUN alone — you won't need TURN
for basic local testing. It matters once real users behind restrictive NATs/firewalls (a
meaningful fraction of any real deployment) try to connect to each other.

`docker-compose.yml` includes an optional `coturn` service with a static demo credential
(`randomcams:randomcams`) for testing the relay path locally:

```bash
docker compose up -d coturn
```

Then in `packages/client/.env`:

```
VITE_TURN_URL=turn:localhost:3478
VITE_TURN_USERNAME=randomcams
VITE_TURN_CREDENTIAL=randomcams
```

For an actual deployment, coturn (or a hosted TURN provider) needs to run on a server with a
public IP — a coturn container behind your own NAT can't relay for other NATed clients, so this
setup is for local relay-path testing only, not a deployment topology.

## Admin moderation panel

`http://localhost:5173/admin` — enter your `ADMIN_TOKEN` to load pending reports. Each shows the
reason, an optional note, and both parties' verified info. "Take action" bans the reported user
immediately; "Dismiss" closes the report with no action. Both are recorded with a `reviewerLabel`
(a free-text name for the audit trail — the actual access control is the shared token, not this
field).

## Account management

- **Email verification** is informational/security hygiene only — it is *not* a gate on using the
  app (the KYC flow is the real gate). Signup sends a verification email (via the console-logging
  mock mailer in `src/mailer` locally — swap in a real provider, e.g. SES/Postmark, before
  deploying) with a link to `/verify-email?token=...`.
- **Password reset**: "Forgot password?" on the login screen → `/auth/request-password-reset`
  (always responds success regardless of whether the email exists, so it can't be used to
  enumerate accounts) → emails a link to `/reset-password?token=...`, valid for 1 hour.
  Completing a reset invalidates every other session on the account (see token revocation below).
- **Token revocation**: every JWT carries a `tokenVersion` that must match the user's current
  value in the DB, checked on every authenticated request (`requireAuth` middleware and the
  socket handshake both do this). A password reset or hitting "Log out everywhere" bumps
  `tokenVersion`, which immediately invalidates every outstanding token for that account — a ban
  also takes effect immediately for the same reason, rather than waiting out the JWT's 30-day
  expiry.

## Automated tests & CI

```bash
cd packages/server
npm test          # runs once
npm run typecheck # tsc over both src/ and test/ (vitest's esbuild transform doesn't type-check)
```

Needs a real Postgres reachable via `DATABASE_URL` (the integration tests exercise real HTTP
routes end-to-end via supertest — signup/login validation, the full KYC verification flow
including the age defense-in-depth check, moderation report creation/escalation, and the admin
API's auth gate and data exposure). The matching queue is unit-tested against `ioredis-mock`
instead, since it doesn't need a real Redis to verify its pairing logic.

CI (`.github/workflows/ci.yml`) runs on every push and PR: spins up Postgres + Redis service
containers, installs deps, generates the Prisma client, applies migrations, builds all three
packages, typechecks, and runs the full test suite.

## Production deployment

Dockerfiles for both `packages/server` and `packages/client` (multi-stage, non-root runtime
images with `HEALTHCHECK`s), a `docker-compose.prod.yml` wiring them up with Postgres/Redis/coturn
behind an nginx edge proxy (`deploy/nginx/edge.conf`), and `.env.production.example` for the
required secrets.

**Important caveat:** these were written using standard, well-established patterns and the
compose file's syntax/variable interpolation was validated (`docker compose config`), but the
actual image builds were **not** executed end-to-end — this repo's sandbox has an egress policy
that blocks pulling base images from Docker Hub's registry CDN, so `docker build` fails here with
a 403 before it can even start. Validate a real `docker compose -f docker-compose.prod.yml build`
and `up` in an environment with normal registry access before relying on this for an actual
deployment.

```bash
cp .env.production.example .env.production
# fill in real secrets, then:
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Architecture: one public domain, terminated at the `edge` nginx container, which serves the
client's static build directly and reverse-proxies `/auth`, `/verification`, `/admin`,
`/socket.io`, and `/health` to the server container — client and API share an origin this way,
so `VITE_SERVER_URL` at build time is just the public domain itself. TLS certs aren't provisioned
by this config (the edge conf assumes they already exist at the paths it references); wire up
certbot or your own cert management separately.

Structured logging: the server uses `pino` (`src/logger.ts`) with `pino-http` request logging
(`/health` excluded from the noise); pretty-printed in development, JSON in production
(`NODE_ENV=production`) for log aggregation. Set `LOG_LEVEL` to control verbosity (tests default
it to `silent`).

## Branching

- `dev_izzy` — active development branch.
- `main` — merge target. Intentionally kept separate so there's always a real PR-able diff
  between the two; opening that PR is a deliberate step, not automatic.

## Production readiness checklist

Things this codebase deliberately does **not** solve yet:

- **Real KYC vendor integration.** Only a mock provider exists. Implement `KycProvider` from
  `verification/provider.ts` against a real vendor, and get a lawyer to confirm 2257
  record-keeping obligations (US) and age-verification law compliance for every launch
  jurisdiction (UK Online Safety Act, EU DSA, various US states).
- **Automated CSAM/content scanning.** Requires an SFU (not pure P2P WebRTC) plus a classifier
  vendor contract and legal reporting integration. See `moderation/csamHook.ts`.
- **Real per-admin staff accounts.** The moderation API is a single shared secret, not
  individual accounts with role-based access and a real audit trail.
- **Test coverage stops at the HTTP/matching layer.** Auth, verification, and moderation are
  covered by real integration tests; the Socket.IO signaling/WebRTC path and the React client
  have none yet.
- **Payment processing.** Standard processors (Stripe, PayPal) prohibit adult-content
  businesses; budget for an adult-industry-specific processor (CCBill, Segpay, Epoch) or crypto.
- **Hosting compliance.** AWS/GCP/Azure all have acceptable-use policies around adult content —
  read them before choosing a host.
- **HTTPS/WSS in production.** The edge nginx config (`deploy/nginx/edge.conf`) routes both the
  API and Socket.IO through TLS, but it assumes certs already exist at the paths it references —
  certbot/cert provisioning and renewal aren't wired up. Also see the caveat under
  [Production deployment](#production-deployment): none of the Dockerfiles/compose have been
  build-tested end-to-end in this repo's sandbox.
- **A real TURN deployment** with a public IP and proper credential rotation (the coturn service
  in `docker-compose.prod.yml` still needs a real, rotated `TURN_CREDENTIAL` — never reuse the
  demo one from the dev `docker-compose.yml`).
- **Rate limiting is IP-based and in-memory** (`express-rate-limit` defaults) — fine for a single
  server, but needs a shared store (e.g. Redis) behind a load balancer, and `app.set('trust
  proxy', ...)` configured correctly or every request behind a proxy shares one IP.
