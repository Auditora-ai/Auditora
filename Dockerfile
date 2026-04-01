# =============================================================================
# Auditora.ai - Multi-stage Dockerfile for Next.js apps
# =============================================================================
# Usage:
#   docker build --build-arg APP_NAME=saas -t auditora-saas .
#   docker build --build-arg APP_NAME=marketing -t auditora-marketing .
#   docker build --build-arg APP_NAME=docs -t auditora-docs .
# =============================================================================

# ---- Base ----
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Installer: install dependencies ----
FROM base AS installer
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json biome.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY tooling/ ./tooling/

RUN pnpm install --frozen-lockfile

# ---- Builder: build target app ----
FROM installer AS builder
ARG APP_NAME=saas

COPY . .

# Generate Prisma client
RUN pnpm --filter @repo/database generate

# Build target app
RUN pnpm --filter ${APP_NAME} build

# ---- Runner: production ----
FROM node:22-alpine AS runner
ARG APP_NAME=saas

RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy everything needed from builder
COPY --from=builder /app/apps/${APP_NAME} ./apps/${APP_NAME}
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/apps/${APP_NAME}/package.json ./apps/${APP_NAME}/package.json

# Copy all package.json files for workspace resolution
COPY --from=builder /app/apps ./apps

RUN chown -R nextjs:nodejs /app

USER nextjs

# Port is set per-app in docker-compose.staging.yml
EXPOSE 3000

WORKDIR /app/apps/${APP_NAME}
CMD ["npx", "next", "start"]
