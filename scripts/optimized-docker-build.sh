#!/bin/bash

# Docker Build Optimization Script
# This script implements aggressive optimizations for Docker image generation

set -e

echo "🚀 Starting optimized Docker build process..."

# Build configuration
IMAGE_NAME="${1:-etendo/etendo_ui}"
TAG="${2:-latest}"
PLATFORMS="${3:-linux/amd64,linux/arm64}"

echo "📦 Building image: ${IMAGE_NAME}:${TAG}"
echo "🏗️ Platforms: ${PLATFORMS}"

# Enable Docker BuildKit
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Build with optimized settings
docker buildx build \
  --platform="${PLATFORMS}" \
  --tag="${IMAGE_NAME}:${TAG}" \
  --cache-from=type=registry,ref="${IMAGE_NAME}:buildcache" \
  --cache-to=type=registry,ref="${IMAGE_NAME}:buildcache",mode=max \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --push \
  .

echo "✅ Docker build completed successfully!"
echo "📊 Image: ${IMAGE_NAME}:${TAG}"
echo "🎯 Optimizations applied:"
echo "   - Multi-stage build with dependency caching"
echo "   - BuildKit cache mounts for pnpm"
echo "   - Registry cache for faster subsequent builds"
echo "   - Optimized layer ordering"
echo "   - Reduced build context size"