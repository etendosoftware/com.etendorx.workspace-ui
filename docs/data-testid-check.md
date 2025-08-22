# Data-testid check

This repository includes an automated check that ensures React components have a deterministic `data-testid` attribute added by a codemod.

Why
- `data-testid` values make UI tests more robust and consistent across PRs.
- The codemod applies `data-testid="ComponentName__<6hex>"` for component JSX elements.

What the CI does
- Jenkins runs `pnpm run check:data-testid` after tests. If the codemod would make changes, the build is marked UNSTABLE and notifications include quick remediation steps.

How to run locally
1. Install dependencies (if needed):
```fish
pnpm install
```
2. Run the check (dry-run):
```fish
pnpm run check:data-testid
```
3. If the check reports modifications, apply them and commit:
```fish
pnpm run apply:data-testid
# review changes
git add -A
git commit -m "Apply add-data-testid codemod"
```

Advanced
- To automatically commit changes from the script: `pnpm run apply:data-testid:commit` (use with caution).
- The codemod scripts are in `./scripts`:
  - `add-data-testid.cjs` — transformer that adds `data-testid` attributes.
  - `remove-data-testid-from-tests.cjs` — removes generated ids from test files (preserves manual ids).
  - `check-add-data-testid.sh` — runs a dry-run and fails if modifications are detected.
  - `apply-add-data-testid.sh` — applies the codemod and optionally commits.

Notes
- Always run the check and apply locally in your branch before pushing to avoid UNSTABLE pipeline status.
- If you need to exclude files or directories from the codemod, update the `excludedPaths` or `testPatterns` inside `scripts/add-data-testid.cjs`.

Procedure for strategic components (protect & adopt dynamic ids)
---------------------------------------------------------------
When you have strategic UI files that must keep stable or semantically meaningful selectors (for example: `DynamicField.tsx`, window pages, toolbar, tabs, menu items or custom selectors), follow this lightweight procedure to update them safely and prevent the codemod from overwriting your manual changes.

1) Protect the file from the codemod
   - Add the marker comment at the top of the file you want to protect:

     // @data-testid-ignore

   - The codemod will detect this marker and skip the file entirely. This allows you to make manual, deterministic changes without the script reapplying its fallback tokens.

2) Adopt dynamic, stable test ids in the component
   - Use stable domain identifiers when available (for example `field.id`, `windowId`, or a stable `key` used by the component) instead of the codemod fallback hash.
   - Preferred pattern (JSX expression):

     data-testid={`ComponentName__${field.id ?? field.hqlName ?? 'fallback'}`}

     Examples used in the repo:
     - `data-testid={`DateSelector__${field.id ?? '6107b5'}`}`
     - `data-testid={`Window__${activeWindow?.windowId ?? windowId ?? '351d9c'}`}`
     - `data-testid={`MenuItem__${windowId}`}`
     - `data-testid={`IconButton__${key}`}`

   - For plain HTML `id` attributes you can follow the same rule for accessibility or test selection:

     id={`MenuTitle__${item.id ?? slug(item.name)}`}

3) Validate locally with the codemod in dry-run
   - Run the check in dry-run mode (this doesn't write files):

     pnpm run check:data-testid

   - If the codemod reports files to modify, make sure your protected files are either skipped (have the marker) or the reported diffs are intended.

4) Apply changes and commit
   - If the dry-run shows intended changes, apply them with:

     pnpm run apply:data-testid

   - Review diffs, commit and push.

5) Optional: allow codemod to manage the file in the future
   - If you later want the codemod to manage a protected file, remove the `// @data-testid-ignore` marker and run the codemod again.

Notes and caveats
 - Keep the expressions simple and deterministic. Prefer using `field.id` (stable) over dynamic runtime values when possible.
 - Use slugification for human-readable fallbacks (e.g., `item.name.replace(/\s+/g, '-')`).
 - Avoid adding optional runtime fallbacks that change between runs (for example random or timestamp-based tokens); they break determinism and CI checks.
