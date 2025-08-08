#!/usr/bin/env bash
set -euo pipefail

MSG="${*:-chore: commit}"

git add -A
git commit -m "$MSG"

