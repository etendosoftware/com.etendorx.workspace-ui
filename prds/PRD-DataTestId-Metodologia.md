# PRD: Data-testid Generation Methodology for Windows UI

## Context and Problem
- This workspace uses an automated codemod (`scripts/add-data-testid.cjs`) that injects deterministic `data-testid` attributes into JSX.
- Today the default format is `data-testid="ComponentName__<6hex>"` for consistency across PRs (see `docs/data-testid-check.md`).
- For Windows UI (form fields, selectors, grids) we often have a window field metadata object (`field`) that may include a stable `field.id`.
- We want to standardize a methodology that uses `field.id` when available to make selectors more semantic and stable while retaining backward compatibility with the current script behavior.

## Goals
- Unify naming convention for `data-testid` across Windows UI.
- Prefer `field.id` when available to produce stable, semantic selectors.
- Provide deterministic fallbacks when `field.id` is not available.
- Integrate smoothly with the existing auto-insert codemod without creating noisy diffs.

## Scope
- Windows UI components involved in form rendering and selection:
  - Form selectors like `TextSelector`, `DateSelector`, `DatetimeSelector`, `NumericSelector`, `ListSelector`, `BooleanSelector`, `SelectSelector`, `LocationSelector`, `TableDirSelector`, etc.
  - Any MUI components used inside those selectors (e.g., `TextField`, `Autocomplete`).
  - Window reference components and grids when applicable.
- Applies to new and existing code touched by the codemod.

References in docs
- `docs/data-testid-check.md` describes the codemod and CI checks.
- `docs/features/field-references.md` maps reference codes to selector components used in Windows UI.
- Window reference/grid related docs: `docs/features/process-execution/window-reference-grid.md`, `docs/features/process-execution/window-reference-mapping.md`.

## Naming Convention
- Base shape: `ComponentName__Token`
  - `ComponentName`: the JSX component name (e.g., `TextField`, `Autocomplete`, `DateSelector`, `TableDirSelector`).
  - `Token` priority:
    1) If `field?.id` exists (Window Field ID): use `${field.id}`.
    2) Else if `field?.column?.name` or `field?.name` exists: use `slug(columnNameOrName)` (lowercase, alphanumeric and dashes only).
    3) Else: keep the current codemod fallback: a short deterministic hash (6 hex chars) based on path + component + node index.

Optional suffixes (only when needed)
- Use suffixes for specific internal parts that are directly tested: `__input`, `__option`, `__label`, `__helper`, `__root`.
- Example: `Autocomplete__productId__option` for options inside an Autocomplete tied to a product field.

## Generation Rules
1) If a `field` variable is in scope and it’s a Window Field (or compatible) and contains a truthy `id`:
   - Generate `data-testid` as a JSX expression (template literal):
     - `{`ComponentName__${field.id}`}`
2) If `field.id` is not present, but `field.column.name` or `field.name` exists:
   - Generate `data-testid` using a slug of that name: ``{`ComponentName__${slug(name)}`}``.
3) If no `field` context is available or neither `id` nor `name` exist:
   - Preserve existing behavior: `ComponentName__<6hex>` from the codemod’s deterministic hash.
4) Do not duplicate an attribute if `data-testid` already exists.
5) Do not overwrite manually written `data-testid` unless they are clearly marked as auto-generated and only differ by fallback vs `field.id` token (safe upgrade path).

## Codemod Integration (`scripts/add-data-testid.cjs`)
- AST detection:
  - Find JSXElements without `data-testid`.
  - Infer `ComponentName` from the element identifier.
  - Check if `field` is in scope (function param/destructuring/closure) and whether `field.id` or `field.column.name` is safely reachable.
- Token logic in the transformer:
  1) If `field.id` is provably present: insert JSXExpressionContainer with template literal:
     - ``data-testid={`ComponentName__${field.id}`}``
  2) Else if a name is available: ``data-testid={`ComponentName__${slug(field.column.name || field.name)}`}``.
  3) Else: `data-testid="ComponentName__<6hex>"` (current strategy).
- Printing rules:
  - Preserve prop order and formatting to minimize diffs.
  - Avoid reformatting unrelated code.
- Upgrade rule (optional and guarded):
  - If a node has an auto-generated fallback id and the transformer can now safely resolve `field.id`, allow replacing the token with `${field.id}`.

### Detecting `field` in Windows UI
Common cases to support:
- `function Selector({ field, ... }) { ... }`
- `({ field }) => ( ... )`
- `const field = props.field;`
- If `field` exists but structure cannot be guaranteed, prefer keeping the fallback and (optionally) leave a hint comment `/* field.id not detected */`.
- As a safe compromise for uncertain cases, avoid emitting expressions like `field?.id ?? 'hash'` unless explicitly enabled, to keep ids deterministic across runs.

## Examples (Windows UI)
- Before (literal fallback):
  - `<TextField data-testid="TextField__a1b2c3" />`
- After (with `field.id`):
  - `<TextField data-testid={`TextField__${field.id}`} />`

- Typical selectors:
  - `DateSelector` → ``data-testid={`DateSelector__${field.id}`}``
  - `TableDirSelector` → ``data-testid={`TableDirSelector__${field.id}`}``
  - `LocationSelector` → ``data-testid={`LocationSelector__${field.id}`}``
  - `NumericSelector` → ``data-testid={`NumericSelector__${field.id}`}``
  - `ListSelector` → ``data-testid={`ListSelector__${field.id}`}``
  - `BooleanSelector` → ``data-testid={`BooleanSelector__${field.id}`}``
  - `SelectSelector` → ``data-testid={`SelectSelector__${field.id}`}```
  - Internal MUI inputs may add suffixes if tests target inner elements (opt-in):
    - `TextField__<token>__input`, `Autocomplete__<token>__option`, etc.

## Edge Cases
- `field.id` is numeric: template literal converts it to string automatically.
- `field.id` empty/null/undefined: use fallback chain (name → hash).
- Repeated components for the same field in the same render tree: suffixes may be used when necessary to disambiguate test targets.
- Data grids: when bound to a field in a row context, consider row-level suffixing if E2E tests require granular targeting (out of scope for the base codemod; can be manual or a dedicated follow-up).
- SSR is unaffected by JSX expressions.

## Migration Plan
1) Run the updated codemod in dry-run and review diffs (`pnpm run check:data-testid`).
2) Apply changes in Windows UI packages first (`packages/MainUI`) (`pnpm run apply:data-testid`).
3) Manually adjust edge cases where `field` could not be detected but is required for tests.
4) Update tests that depended on legacy fallback ids where necessary.

## Acceptance Criteria
- 95%+ of Windows UI selectors that have `field.id` generate `data-testid` as `ComponentName__<field.id>`.
- No duplicate `data-testid` is added to a JSX element.
- Manually authored `data-testid` remain untouched (unless explicitly marked as auto-generated and safely upgradable).
- CI `check:data-testid` remains stable (no unexpected diffs after applying once).

## Test Plan
- Unit tests for the transformer with fixtures:
  - `field.id` present.
  - Only `field.name`/`field.column.name` present.
  - No `field` in scope.
  - Existing `data-testid` present.
- E2E smoke flows: select Windows UI controls via `data-testid` in at least 3 representative windows.

## Non-Goals
- Removing or altering manually authored `data-testid` (unless marked for auto-upgrade).
- Enforcing a lint rule (can be a future enhancement).

## Risks
- False positives/negatives detecting `field` in complex scopes.
- Large diffs if the printer reorders props or reformats code; keep printing conservative.

## Annex
- Codemod script: `scripts/add-data-testid.cjs`
- Docs:
  - `docs/data-testid-check.md`
  - `docs/features/field-references.md`
  - `docs/features/process-execution/window-reference-grid.md`
  - `docs/features/process-execution/window-reference-mapping.md`
