#!/usr/bin/env bash
# Ejecuta el codemod add-data-testid en modo dry-run y falla si detecta cambios.
# Uso: ./scripts/check-add-data-testid.sh [path]

set -euo pipefail

ROOT_DIR=$(dirname "$(dirname "${BASH_SOURCE[0]}")")
TARGET_PATH=${1:-packages/MainUI}
JSCODESHIFT_CMD="npx jscodeshift -t ./scripts/add-data-testid.cjs $TARGET_PATH --extensions=tsx,jsx --parser=tsx --ignore-pattern='**/node_modules/**' --ignore-pattern='**/dist/**' --ignore-pattern='**/.next/**' -d -p"

echo "Running data-testid codemod dry-run on: $TARGET_PATH"
# Ejecutar y capturar salida
OUTPUT=$(eval "$JSCODESHIFT_CMD" 2>&1) || RC=$?
RC=${RC:-0}

# jscodeshift devuelve 0 incluso si hubo modificaciones en dry-run; parsear la sección "Results:"
printf "%s\n" "$OUTPUT"

# Extraer números desde las líneas de resultados (ej. "0 errors", "135 unmodified", "0 ok")
# Si no se encuentran, devolver 0 por defecto.
ERRORS=$(printf "%s" "$OUTPUT" | grep -Eo "^[[:space:]]*[0-9]+[[:space:]]+errors" | grep -Eo "[0-9]+" | head -n1 || true)
OK_COUNT=$(printf "%s" "$OUTPUT" | grep -Eo "^[[:space:]]*[0-9]+[[:space:]]+ok" | grep -Eo "[0-9]+" | head -n1 || true)
UNMODIFIED_COUNT=$(printf "%s" "$OUTPUT" | grep -Eo "^[[:space:]]*[0-9]+[[:space:]]+unmodified" | grep -Eo "[0-9]+" | head -n1 || true)

ERRORS=${ERRORS:-0}
OK_COUNT=${OK_COUNT:-0}
UNMODIFIED_COUNT=${UNMODIFIED_COUNT:-0}

if [ "$ERRORS" -gt 0 ]; then
  echo "Errors detected while running codemod. See output above."
  exit 2
fi

# If any OK (actual modifications) are present, fail the script to indicate the codemod would change files
if [ "$OK_COUNT" -gt 0 ]; then
  echo "Codemod would modify $OK_COUNT files. Failing check."
  exit 1
fi

echo "No codemod modifications detected (ok=0)."
exit 0
