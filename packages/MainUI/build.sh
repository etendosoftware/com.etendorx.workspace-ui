#!/bin/sh

rm -rf .next
NEXT_TELEMETRY_DISABLED=1 pnpm build
cp -R public .next/standalone/packages/MainUI/.next
cp -R .next/static .next/standalone/packages/MainUI/.next
cp -R .next/standalone ../../dist
exit 0
