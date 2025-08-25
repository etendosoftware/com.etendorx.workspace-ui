#!/bin/sh

# Clean previous builds
rm -rf .next
rm -rf ../../dist

# Build with Next.js standalone output (optimized for Docker)
NEXT_TELEMETRY_DISABLED=1 pnpm build

# Copy static assets to standalone build
cp -R public .next/standalone/packages/MainUI/.next
cp -R .next/static .next/standalone/packages/MainUI/.next

# Copy the complete standalone build to dist
cp -R .next/standalone ../../dist

echo "Build completed successfully. Standalone output ready in ../../dist"
exit 0
