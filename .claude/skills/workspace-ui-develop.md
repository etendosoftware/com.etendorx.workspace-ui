---
name: workspace-ui-develop
description: Patrones de implementación, reglas de código y flujo de pre-PR para desarrollo frontend en Etendo WorkspaceUI. Usado por Marco.
---

# Etendo WorkspaceUI — Development Patterns

## Implementation Rules

### Research Phase (before writing code)
1. Read ALL files listed in Traza's "Affected Files" and "Reuse Opportunities"
2. Search `packages/ComponentLibrary/src/` for components that match the need
3. Check existing hooks in `packages/MainUI/hooks/` for data fetching patterns
4. Read existing context providers in `packages/MainUI/contexts/` to understand available state

### Code Rules
- TypeScript strict: no `any`, no `as unknown`, explicit return types on all functions, no unused variables or imports (treat as build error)
- Spanish neutral in all UI text ("¿Quieres eliminar?" — never voseo)
- No new npm libraries without checking `root package.json` and `packages/MainUI/package.json` first
- Follow existing file and directory naming conventions
- Run `pnpm check:fix` from project root before every commit
- Reusable components → `packages/ComponentLibrary/src/`; page-specific → `packages/MainUI/`

### Commit Format
```
Feature ETP-XXXX: <what was done in ≤80 chars>

Co-Authored-By: Marco <noreply@anthropic.com>
```
For hotfixes: `Hotfix ETP-XXXX: <what was done in ≤80 chars>`

HARD LIMIT: Subject line MUST be ≤80 characters. "Feature ETP-XXXX: " is 18 chars → max 62 chars for description.

Formatting corrections ALWAYS in a separate commit, never mixed with logic changes.

## Pre-PR Cleanup (mandatory, in order)

### Step 1 — Apply data-testid attributes
```bash
pnpm apply:data-testid
```
If it modifies files: stage ALL changes and commit in a dedicated commit:
```
Feature ETP-XXXX: apply data-testid attributes
```

### Step 2 — Fix formatting
```bash
pnpm format:fix
```
If it modifies files: stage ALL changes and commit in a dedicated commit:
```
Feature ETP-XXXX: apply formatting fixes
```

Steps 1 and 2 MUST be separate commits from each other and from logic commits.

### Step 3 — Verify build
```bash
pnpm build 2>&1 | tail -30
```

### Step 4 — Verify linting
```bash
pnpm check
```
Must pass with zero errors.

## Hard Rules
- Never touch `packages/api-client/` internals, backend routes, or server logic
- Never write unit or integration tests — that is the test agent's responsibility
- Never push directly to main, develop, or epic branches
- Never commit with a failing build or linting errors
- Never use `any` type or disable TypeScript checks with @ts-ignore
- No new libraries without first verifying they are not already available
