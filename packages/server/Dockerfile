# Build context must be the repo root (npm workspaces need the root
# package.json/lockfile), e.g.:
#   docker build -f packages/server/Dockerfile -t randomcams-server .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/client/package.json packages/client/package.json
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/shared packages/shared
COPY packages/server packages/server
RUN npm run build --workspace=packages/shared \
  && (cd packages/server && npx prisma generate) \
  && npm run build --workspace=packages/server

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/server/package.json ./packages/server/package.json
COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY --from=build /app/packages/server/prisma ./packages/server/prisma

WORKDIR /app/packages/server
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Applies pending migrations before starting - safe to run on every container
# start (a no-op when there's nothing new to apply), but means only one
# instance should be starting at a time during a deploy (no rolling restart
# of multiple replicas simultaneously without moving this to a separate
# release/init step).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
