# Deployment runbook

A concrete, ordered path from this repo to a live public URL. Each step says what it actually
buys you and what happens if you skip it. This assumes the "self-hosted single machine" topology
in `docker-compose.prod.yml`; a managed-Postgres/managed-Redis variant is equally valid and
lower-ops, see the comment at the top of that file.

I (the agent working on this repo) cannot do the items below myself — they need a payment method,
a business identity, or a decision only you can make. Everything code-shaped is already done;
this is the checklist for the rest.

## 0. Read this first

Two categories of work remain, and they don't block each other the same way:

- **Infrastructure** (sections 1–7 below): a VPS, a domain, TLS, and `docker compose up`. You can
  do all of this today and have a working URL by the end of it.
- **Business/legal gates** (section 8): real KYC vendor, lawyer-reviewed ToS, an adult-industry
  payment processor, hosting ToS compliance. These determine whether it's *lawful and safe* to
  point that URL at real strangers, not whether the software runs. Standing the infrastructure up
  first, behind a password/allowlist, so you (and invited testers) can use it before any of
  section 8 is closed is reasonable. Opening it to the public internet before section 8 is closed
  is not — that's the CSAM/exploitation/minor-safety exposure this project has been built around
  avoiding from the start.

## 1. Pick a host

Any VPS provider works technically. Two things narrow the list:

- **Acceptable-use policy for adult content.** AWS, GCP, and Azure's AUPs create real risk for
  this category — read them before committing infrastructure spend there. Providers commonly used
  for adult platforms in practice: Hetzner, OVH, Vultr, DigitalOcean (check current ToS yourself;
  policies change). This is not legal advice — verify against the provider's current terms.
- **Capacity.** A single mid-tier VPS (4 vCPU / 8GB RAM) comfortably runs Postgres + Redis +
  coturn + the app containers for a small-to-medium user base. WebRTC media itself is peer-to-peer
  (this app doesn't run an SFU), so server load scales with signaling/matching traffic, not with
  concurrent video bandwidth — TURN relay bandwidth is the exception, see section 4.

## 2. DNS

Point an A record (and AAAA if the host gives you IPv6) at the VPS's public IP:

```
api-and-app.example.com  →  <vps-ip>
```

One domain for both API and client, matching `CLIENT_ORIGIN` in `.env.production` — the edge
nginx config routes `/auth`, `/verification`, `/admin`, `/webrtc`, `/socket.io`, `/health` to the
server and everything else to the client's static build, so they share an origin and you don't
need a second domain or CORS wildcarding.

## 3. Provision the box

```bash
# on the VPS
curl -fsSL https://get.docker.com | sh   # or your distro's docker + docker-compose-plugin packages
git clone https://github.com/hgisuruudara/randomcams.git
cd randomcams
git checkout dev_izzy   # or main, once dev_izzy is merged
```

## 4. TURN

coturn needs to run on a box with a genuinely public IP (this VPS qualifies; a home server behind
your router's NAT does not — it can't relay for other NATed clients). The compose file's `coturn`
service is already configured for coturn's REST API auth mode (see `TURN server` in `README.md`);
you only need to supply a real secret:

```bash
openssl rand -hex 32   # → TURN_SECRET in .env.production
```

Open UDP/TCP 3478 and UDP 49160-49200 on the VPS firewall (`docker-compose.prod.yml` already
publishes these). If the host is also behind a cloud provider's separate security-group firewall
(AWS/GCP-style), open the same ports there too.

## 5. TLS

`deploy/nginx/edge.conf` expects certs at `/etc/letsencrypt/live/<domain>/`. Get real ones with
certbot before first bringing the stack up (the compose file mounts `certbot_conf`/`certbot_www`
volumes for this):

```bash
docker run -it --rm -v randomcams_certbot_conf:/etc/letsencrypt -v randomcams_certbot_www:/var/www/certbot \
  -p 80:80 certbot/certbot certonly --standalone -d api-and-app.example.com
```

Set up renewal (certbot's own timer, or a cron calling `certbot renew` against the same volumes)
— Let's Encrypt certs expire in 90 days.

## 6. Configure and start

```bash
cp .env.production.example .env.production
# fill in every value - see the file's own comments for what each one needs.
# Minimums: POSTGRES_PASSWORD, CLIENT_ORIGIN, JWT_SECRET, ADMIN_TOKEN, TURN_SECRET,
# TURN_URLS, TURN_REALM. GOOGLE_CLIENT_ID and KYC_* are required before this is safe
# to open to real users - see section 8.

docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

# apply migrations against the running postgres container
docker compose --env-file .env.production -f docker-compose.prod.yml exec server npx prisma migrate deploy
```

**Caveat carried over from the README:** these Dockerfiles/compose files were written against
standard, well-established patterns and their compose syntax was validated with `docker compose
config`, but the actual image builds have not been executed end-to-end in this project's sandbox
(its egress policy blocks the Docker Hub registry CDN needed to pull base images). Run the `build`
step above yourself and work through whatever surfaces before relying on this for real traffic —
don't treat it as pre-verified.

## 7. Smoke test

- `curl https://api-and-app.example.com/health` → `{"ok":true}`
- Sign up, click through the mock-KYC flow (still the mock provider at this point — see section 8
  for swapping in a real one), confirm you land on the matching screen.
- Open the same URL in two browsers/devices, verify camera gate + matching + a real WebRTC call
  connects. If it fails to connect specifically between two devices on *different* networks, check
  `chrome://webrtc-internals` on both — this is the TURN relay path being exercised, and a
  connection failure there usually means the TURN ports (section 4) aren't actually reachable from
  outside, not a code bug.
- Hit `/admin` with your `ADMIN_TOKEN`, confirm reports load (empty is fine on a fresh instance).

## 8. Business/legal gates — before any of this is safe to advertise publicly

None of these are things this repo's code can close on its own:

- **Real KYC vendor.** `KYC_PROVIDER=mock` must not run in production — anyone can click "verified"
  in the mock flow. Implement `KycProvider` (`packages/server/src/verification/provider.ts`)
  against a real vendor (Veriff, Persona, Yoti, etc.), get an API key, wire `KYC_API_KEY`/
  `KYC_WEBHOOK_SECRET`. Get counsel to confirm ID-record retention (2257 in the US) and
  age-verification law obligations for every jurisdiction you'll serve (UK Online Safety Act, EU
  DSA, various US state laws — these are changing rapidly as of 2026).
- **Legal review of the draft ToS/Privacy Policy** (`packages/client/src/pages/TermsPage.tsx`,
  `PrivacyPage.tsx`) — these are placeholders, not lawyer-drafted documents. Do not launch on the
  draft text.
- **Payment processor**, if this becomes a paid product — Stripe/PayPal prohibit adult content;
  budget for CCBill, Segpay, Epoch, or similar, or a crypto processor.
- **Real mailer.** `src/mailer` ships a console-logging mock. Wire a real provider (SES, Postmark,
  SendGrid) via the `Mailer` interface before email verification/password reset actually need to
  reach real inboxes.
- **Per-admin staff accounts.** `/admin` is currently one shared `ADMIN_TOKEN` with no audit trail
  tying an action to a specific reviewer. Fine for you alone reviewing reports; not fine the
  moment a second person needs access.
- **Automated CSAM scanning is not implemented** (`packages/server/src/moderation/csamHook.ts` is
  an explicit, documented stub) — this app currently relies entirely on human review of reports,
  which is a deliberate design choice (see README's "Safety & compliance model") but is not a
  substitute for a classifier + hash-matching pipeline (e.g. via an SFU + a vendor like Thorn) at
  real scale.

Standing the stack up behind section 1–7 and testing it yourself, or with a small group of people
you've personally invited and told it's a test, doesn't require section 8 to be finished. Opening
sign-up to the general public does.
