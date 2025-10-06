# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

ARG ETENDO_CLASSIC_URL
ARG DEBUG_MODE
ENV ETENDO_CLASSIC_URL=${ETENDO_CLASSIC_URL}
ENV DEBUG_MODE=${DEBUG_MODE}

# Dependencies layer - cached separately
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable corepack and pnpm
RUN corepack prepare pnpm@9.15.2 --activate && corepack enable pnpm

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/MainUI/package.json ./packages/MainUI/
COPY packages/ComponentLibrary/package.json ./packages/ComponentLibrary/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/storybook/package.json ./packages/storybook/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder layer - only rebuilt when source changes
FROM deps AS builder
WORKDIR /app

# Copy only necessary configuration files
COPY tsconfig.json turbo.json ./
COPY biome.json ./

# Copy source code for packages
COPY packages/MainUI ./packages/MainUI
COPY packages/ComponentLibrary ./packages/ComponentLibrary
COPY packages/api-client ./packages/api-client

# Build application (only MainUI)
RUN cd packages/MainUI && pnpm build

# RUN ls -la /app/dist

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Enable verbose logging
ENV NODE_OPTIONS="--trace-warnings --trace-deprecation"
ENV DEBUG="*"
ENV NEXT_DEBUG=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build output from Next.js
# Build structure:
#   /packages/MainUI/.next/standalone (all standalone files)
#   /packages/MainUI/.next/static     (static assets)
COPY --from=builder --chown=nextjs:nodejs /app/packages/MainUI/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/MainUI/.next/static ./packages/MainUI/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/MainUI/public ./packages/MainUI/public

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Set working directory to the main app package (contains server.js)
WORKDIR /app/packages/MainUI

# Run the standalone server
CMD ["node", "server.js"]

