# syntax=docker/dockerfile:1
# --- Stage 1: Build ---
ARG NODE_VERSION=23.1.0
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /app

# Dependency cache layer.
COPY package.json package-lock.json ./

# The GitHub Packages token is a BuildKit secret (frontend-cicd.yml >= MAIR-416 passes it as
# `node_auth_token`, the test scripts with --secret id=node_auth_token,env=NODE_AUTH_TOKEN), never a
# build arg: it stays out of the layers and the provenance. The tracked .npmrc (registry + token
# placeholder) is bind-mounted read-only; a missing secret fails the build.
RUN --mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN,required=true \
    --mount=type=bind,source=.npmrc,target=/app/.npmrc \
    npm ci

# Copie du code source et build
COPY . .
RUN npm run build

# --- Stage 2: Runner ---
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

# Sécurité & Healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 nextjs

# On copie le dossier standalone qui contient déjà son propre node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=5000

CMD ["node", "server.js"]