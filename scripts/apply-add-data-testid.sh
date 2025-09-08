#!/usr/bin/env bash
# Aplica el codemod add-data-testid y opcionalmente hace commit de los cambios.
# Uso: ./scripts/apply-add-data-testid.sh [path] [--commit]

set -euo pipefail

ROOT_DIR=$(dirname "$(dirname "${BASH_SOURCE[0]}")")
TARGET_PATH=${1:-packages/MainUI}
COMMIT_FLAG=${2:-}

JSCODESHIFT_CMD="npx jscodeshift -t ./scripts/add-data-testid.cjs $TARGET_PATH --extensions=tsx,jsx --parser=tsx --ignore-pattern='**/node_modules/**' --ignore-pattern='**/dist/**' --ignore-pattern='**/.next/**'"

echo "Applying data-testid codemod to: $TARGET_PATH"
# Ejecutar codemod (escribe cambios)
eval "$JSCODESHIFT_CMD"

# Mostrar status git
if git rev-parse --git-dir >/dev/null 2>&1; then
  CHANGED=$(git status --porcelain)
  if [ -n "$CHANGED" ]; then
    echo "Files modified by codemod:" 
    git --no-pager status --short
    # Try to format files using biome to restore expected formatting
    if command -v pnpm >/dev/null 2>&1; then
      echo "Running formatter (biome) on repository before commit..."
      pnpm run format:fix || echo "Formatter failed or not configured; continuing."
    fi

    if [ "$COMMIT_FLAG" = "--commit" ] || [ "$COMMIT_FLAG" = "--commit" ]; then
      git add -A
      git commit -m "Apply add-data-testid codemod"
      echo "Changes committed."
    else
      echo "Changes are staged in working tree. Commit them manually or re-run with --commit."
    fi
  else
    echo "No files changed by codemod."
  fi
else
  echo "Not a git repository; codemod applied but cannot show git status."
fi
