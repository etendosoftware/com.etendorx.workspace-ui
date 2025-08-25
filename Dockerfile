# syntax=docker.io/docker/dockerfile:1

# Use debian-slim for better compatibility and fewer network issues
FROM node:18-slim AS base

ARG ETENDO_CLASSIC_URL
ARG DEBUG_MODE
ENV ETENDO_CLASSIC_URL=${ETENDO_CLASSIC_URL}
ENV DEBUG_MODE=${DEBUG_MODE}

# Install only essential system dependencies
RUN apt-get update && apt-get install -y \
    libc6 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Enable pnpm globally
RUN corepack prepare pnpm@9.15.2 --activate && corepack enable pnpm

# Stage for installing dependencies only
FROM base AS deps
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/MainUI/package.json ./packages/MainUI/
COPY packages/ComponentLibrary/package.json ./packages/ComponentLibrary/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/storybook/package.json ./packages/storybook/

# Install dependencies with cache mount and frozen lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --ignore-scripts

# Build stage - copy source and build
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code (after dependencies for better layer caching)
COPY . .

# Restore package.json files and node_modules per package if needed
## Copy per-package node_modules from deps stage. Avoid shell redirections in Dockerfile COPY.
COPY --from=deps /app/packages/MainUI/node_modules ./packages/MainUI/node_modules
COPY --from=deps /app/packages/ComponentLibrary/node_modules ./packages/ComponentLibrary/node_modules
COPY --from=deps /app/packages/api-client/node_modules ./packages/api-client/node_modules

# Build the application
RUN pnpm build

# Production image - copy build output
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Optimize for production
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Copy the standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/dist ./

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/packages/MainUI

CMD ["node", "server.js"]

