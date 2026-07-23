// Must match CURRENT_TOS_VERSION in packages/shared/src/index.ts - kept as a
// separate local constant rather than imported at runtime because importing
// a new const value from the shared workspace package breaks Vite's
// production build (a Rollup/CJS-interop quirk with this monorepo's dev-only
// tsc-built shared package; works fine in dev, fails only in `vite build`).
// The server is unaffected and imports the shared constant directly, since
// it's the one place that actually needs to be authoritative.
export const DISPLAYED_TOS_VERSION = '2026-07-23';
