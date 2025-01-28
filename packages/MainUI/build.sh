#!/bin/sh

rm -rf .next
pnpm build
cp -R public .next/standalone/packages/MainUI/.next
cp -R .next/static .next/standalone/packages/MainUI/.next
cp -R .next/standalone ../../dist
exit 0
