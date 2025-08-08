#!/bin/sh

rm -rf .next
rm -rf ../../dist
# Disable remote fonts for offline/CI builds to avoid network fetches
DISABLE_REMOTE_FONTS=1 NEXT_TELEMETRY_DISABLED=1 pnpm build
cp -R public .next/standalone/packages/MainUI/.next
cp -R .next/static .next/standalone/packages/MainUI/.next
cp -R .next/standalone ../../dist
exit 0
