# Build context must be the repo root, e.g.:
#   docker build -f packages/client/Dockerfile \
#     --build-arg VITE_SERVER_URL=https://api.example.com \
#     -t randomcams-client .
#
# Vite bakes VITE_* values in at BUILD time, not runtime - each of these
# needs to be supplied as a --build-arg (or via docker-compose's build.args)
# pointing at wherever the server is actually reachable for end users,
# not localhost.

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
COPY packages/client packages/client
RUN npm run build --workspace=packages/shared

ARG VITE_SERVER_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_TURN_URL
ARG VITE_TURN_USERNAME
ARG VITE_TURN_CREDENTIAL
ENV VITE_SERVER_URL=$VITE_SERVER_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_TURN_URL=$VITE_TURN_URL \
    VITE_TURN_USERNAME=$VITE_TURN_USERNAME \
    VITE_TURN_CREDENTIAL=$VITE_TURN_CREDENTIAL
RUN npm run build --workspace=packages/client

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -q -O- http://localhost/health || exit 1
