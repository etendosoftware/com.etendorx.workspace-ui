---
name: workspace-ui-review
description: Checklist de code review para TypeScript/React en Etendo WorkspaceUI. Usado por Crisol cuando el diff contiene .tsx/.ts.
---

# Etendo WorkspaceUI — Code Review Checklist

## Review Checklist

### Correctness
- Does it actually solve what the Jira issue describes?
- Are edge cases handled: empty arrays, null/undefined values, loading states, error states?
- Could it break existing functionality in the affected areas?

### Duplicate Code & DRY Violations (BLOCKER if severe, SUGGESTION otherwise)
- Logic reimplemented that already exists in hooks, utils, or components?
- New components created when an existing one in ComponentLibrary or MainUI could be reused/extended?
- Repeated blocks (3+ occurrences) that should be extracted to a shared helper?
- Similar API call patterns duplicated instead of using/extending existing hooks?

### Bad Practices
- `any` types used anywhere → BLOCKER
- Unused variables or unused imports → BLOCKER
- @ts-ignore or TypeScript suppression without justification → BLOCKER
- Hardcoded strings in UI that should be i18n keys or constants → SUGGESTION
- Direct API calls inside components instead of hooks → BLOCKER
- Missing TypeScript types on exported function signatures → SUGGESTION
- console.log statements left in code → NIT
- Side effects outside useEffect → BLOCKER
- Mutation of props or context state directly → BLOCKER

### Conventions
- Branch name: `feature/ETP-*` for features, `hotfix/ETP-*` for hotfixes → BLOCKER if wrong
- Commit subject >80 characters → BLOCKER ("Feature ETP-XXXX: " is 18 chars, max 62 for description)
- Commit format: "Feature ETP-XXXX: <msg>" or "Hotfix ETP-XXXX: <msg>" → BLOCKER if wrong
- Formatting corrections NOT in a separate commit (mixed with logic) → BLOCKER

### Commit Length Audit (mandatory on every review)
Run:
```bash
git log <base_branch>...<branch_name> --format="%s" | awk '{if(length($0)>80) print NR": "length($0)" chars → "$0}'
```
Any subject exceeding 80 chars → BLOCKER. ALL commits must comply.

### Pre-PR Cleanup Verification
Verify mandatory pre-PR steps were executed:
- `pnpm apply:data-testid` — if interactive elements missing `data-testid` → BLOCKER
- `pnpm format:fix` — if Biome formatting violations visible → BLOCKER

### Unit Test Duplication (BLOCKER if severe, SUGGESTION otherwise)
When diff includes test files (`*.test.tsx`, `*.test.ts`):
- Identical it() blocks differing only in data → BLOCKER: must use test.each
- Copy-pasted render/mock setup across it() blocks → BLOCKER: extract to beforeEach
- Duplicate mock definitions across files → SUGGESTION: extract to `_test-utils/`
- Inline render wrappers in 2+ it() blocks → BLOCKER: extract to const

### Documentation Verification
If Pluma reported CREATED/UPDATED: verify doc file is in the branch diff:
```bash
git diff <base_branch>...<branch_name> --name-only | grep "client/docs/"
```
If reported but NOT in diff → BLOCKER.

### Cypress Test Commit Verification
If Argos reported GENERATED: verify test file is in the branch diff:
```bash
git diff <base_branch>...<branch_name> --name-only | grep cypress-tests/
```
If reported but NOT in diff → BLOCKER.

### Code Metrics (always SUGGESTION, never BLOCKER)
- Functions > 50 lines
- Files > 800 lines
- Nesting > 4 levels deep
- More than 5 props without grouping

### Basic Security (Vigia handles deep security)
- No API keys, tokens, secrets, or credentials in code/comments → BLOCKER
- `dangerouslySetInnerHTML` without sanitization → BLOCKER

### Post-Review Cleanup (mandatory every review cycle)
Run after every review:
```bash
pnpm apply:data-testid
pnpm format:fix
```
If either modifies files, commit each separately.
