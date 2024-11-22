#!/bin/sh

rm -rf .next
pnpm build
cp -R public .next/standalone/packages/MainUI/.next/
cd .next
cp -R static standalone/packages/MainUI/.next/

