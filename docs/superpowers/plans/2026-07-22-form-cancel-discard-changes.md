# Form View "Cancel" Discard-Changes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Form View "Cancel" button discard pending edits and stay in Form View when the form is dirty, and navigate back to Grid View only when the form is clean.

**Architecture:** Modify the single toolbar `back` handler (`handleBack`) in `FormActions.tsx`. Extract the existing unconditional navigation into `navigateBack()` and wrap it with a dirty check in `handleBack()`. Repoint the keyboard-Escape path at `navigateBack()` so its "save-then-leave" behavior is preserved unchanged.

**Tech Stack:** React, TypeScript, react-hook-form, Jest + React Testing Library.

> **Commit policy for this task:** Per the user's standing preference, do NOT commit mid-task. `git add` (stage) as you go; all commits happen at the end on a dedicated branch (`feature/ETP-XXXX`). The "Stage" steps below reflect this.

---

## Spec

See `docs/superpowers/specs/2026-07-22-form-cancel-discard-changes-design.md`.

## File Structure

- **Modify:** `packages/MainUI/components/Form/FormView/FormActions.tsx`
  - Extract `navigateBack` (unconditional: `clearTabFormState` + `resetFormChanges`).
  - Rewrite `handleBack` to branch on `isDirty`: dirty → `formContext.reset()` + return; clean → `navigateBack()`.
  - Repoint `handleKeyboardEscape` to call `navigateBack()` instead of `handleBack()` (preserves save-then-leave).
- **Modify (tests):** `packages/MainUI/components/Form/FormView/__tests__/FormActions.test.tsx`
  - Add `mockReset` to the `useFormContext` default mock.
  - Add two tests for the Cancel (`back`) action: dirty-reverts-in-place, clean-navigates-to-grid.

## Key existing code (before changes)

`FormActions.tsx:197-202`:
```ts
const handleBack = useCallback(() => {
  if (windowIdentifier) {
    clearTabFormState(windowIdentifier, tab.id);
  }
  resetFormChanges();
}, [windowIdentifier, clearTabFormState, tab, resetFormChanges]);
```

`FormActions.tsx:213-220`:
```ts
const handleKeyboardEscape = useCallback(async () => {
  if (saveButtonState.isSaving || saveButtonState.isCalloutLoading) return;
  if (isDirty) {
    const saved = await handleSave({ showModal: false });
    if (!saved) return;
  }
  handleBack();
}, [isDirty, handleSave, handleBack, saveButtonState.isSaving, saveButtonState.isCalloutLoading]);
```

`formContext` is available at `FormActions.tsx:54` (`const formContext = useFormContext();`), so `formContext.reset()` is in scope.

---

## Task 1: Add failing tests for the Cancel button behavior

**Files:**
- Test: `packages/MainUI/components/Form/FormView/__tests__/FormActions.test.tsx`

- [ ] **Step 1: Add `mockReset` and include it in the `useFormContext` default mock**

Near the other `const mockX = jest.fn()` declarations (around line 59-65), add:
```ts
const mockReset = jest.fn();
```

In `beforeEach`, update the default `useFormContext` mock (currently line 163-165) to include `reset`:
```ts
(useFormContext as jest.Mock).mockReturnValue({
  formState: { isDirty: false },
  reset: mockReset,
});
```

- [ ] **Step 2: Write the two failing tests**

Add this `describe` block inside the top-level `describe("FormActions", ...)` (e.g. right after the `"calls refetch and resetFormChanges on refresh action"` test near line 440):

```ts
describe("cancel (back) action", () => {
  it("reverts changes and stays in Form View when the form is dirty", () => {
    (useFormContext as jest.Mock).mockReturnValue({
      formState: { isDirty: true },
      reset: mockReset,
    });
    renderFormActions(props);

    const registeredActions = mockRegisterActions.mock.calls[0][0];
    registeredActions.back();

    // Discards pending edits via react-hook-form reset...
    expect(mockReset).toHaveBeenCalledTimes(1);
    // ...and does NOT navigate away (stays in Form View).
    expect(mockClearTabFormState).not.toHaveBeenCalled();
  });

  it("navigates to Grid View when the form is clean", () => {
    (useFormContext as jest.Mock).mockReturnValue({
      formState: { isDirty: false },
      reset: mockReset,
    });
    renderFormActions(props);

    const registeredActions = mockRegisterActions.mock.calls[0][0];
    registeredActions.back();

    // Clean form -> navigate back to the grid...
    expect(mockClearTabFormState).toHaveBeenCalledWith("WIN1", "TAB1");
    // ...and does NOT touch the form buffer.
    expect(mockReset).not.toHaveBeenCalled();
  });
});
```

Rationale (per spec review): assert on observable behavior (`reset` called / `clearTabFormState` not called), not on the async `resetFormChanges` re-sync effect, which does not fire under a static `isDirty` mock.

- [ ] **Step 3: Run tests to verify they FAIL**

Run (from the repo root):
```bash
pnpm test:mainui -- FormActions
```
(`test:mainui` = `jest --selectProjects MainUI`; the `FormActions` positional is a filename pattern.)
Expected: the two new tests FAIL. The dirty test fails because current `handleBack` calls `clearTabFormState` (so `mockClearTabFormState` IS called) and never calls `reset`. The clean test likely already passes (current behavior navigates) — that is fine; the dirty test is the one that must fail before the change.

- [ ] **Step 4: Stage the test changes**

```bash
git add packages/MainUI/components/Form/FormView/__tests__/FormActions.test.tsx
```
(Do NOT commit — see commit policy.)

---

## Task 2: Implement the conditional Cancel behavior

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/FormActions.tsx:197-202` (and `:219`)

- [ ] **Step 1: Extract `navigateBack` and rewrite `handleBack`**

Replace the current `handleBack` (lines 197-202) with:
```ts
const navigateBack = useCallback(() => {
  if (windowIdentifier) {
    clearTabFormState(windowIdentifier, tab.id);
  }
  resetFormChanges();
}, [windowIdentifier, clearTabFormState, tab, resetFormChanges]);

const handleBack = useCallback(() => {
  if (isDirty) {
    // Discard pending changes: revert the buffer to the last-loaded state and
    // stay in Form View. The isDirty effect re-syncs the dirty flags afterwards.
    formContext.reset();
    return;
  }
  navigateBack();
}, [isDirty, formContext, navigateBack]);
```

- [ ] **Step 2: Repoint the keyboard-Escape path at `navigateBack`**

In `handleKeyboardEscape` (line 219), change the final call from `handleBack();` to `navigateBack();`, and update its dependency array accordingly:
```ts
const handleKeyboardEscape = useCallback(async () => {
  if (saveButtonState.isSaving || saveButtonState.isCalloutLoading) return;
  if (isDirty) {
    const saved = await handleSave({ showModal: false });
    if (!saved) return;
  }
  navigateBack();
}, [isDirty, handleSave, navigateBack, saveButtonState.isSaving, saveButtonState.isCalloutLoading]);
```
Why: after Escape auto-saves a dirty form, the intent is to leave for the grid. Keeping `handleBack` here would capture the stale `isDirty === true` and wrongly call `reset()`. `navigateBack()` preserves the existing Escape behavior exactly.

- [ ] **Step 3: Run the new tests to verify they PASS**

Run (from the repo root):
```bash
pnpm test:mainui -- FormActions
```
Expected: all tests in the file PASS, including the two new ones and the existing Escape tests (`"Escape with dirty form saves then calls back"` still expects `clearTabFormState` to be called — satisfied via `navigateBack`).

- [ ] **Step 4: Run lint/format on the changed files**

Run (from the repo root):
```bash
pnpm exec biome check packages/MainUI/components/Form/FormView/FormActions.tsx packages/MainUI/components/Form/FormView/__tests__/FormActions.test.tsx
```
Expected: no errors. To auto-fix, add `--write` (e.g. `pnpm exec biome check --write <paths>`), or run the repo-wide `pnpm check:fix`.

- [ ] **Step 5: Stage the implementation changes**

```bash
git add packages/MainUI/components/Form/FormView/FormActions.tsx
```
(Do NOT commit — see commit policy.)

---

## Task 3: Full regression check

- [ ] **Step 1: Run the whole Form test suite to confirm no regressions**

Run (from the repo root):
```bash
pnpm test:mainui -- FormActions FormView
```
Expected: PASS. Pay special attention to the existing `"keyboard shortcuts"` Escape tests — they must remain green.

- [ ] **Step 2: Manual verification (optional but recommended)**

Use the `/run` or `verify` skill to drive the app: open a window, enter Form View on an existing record, edit a field, click Cancel → the field reverts and you stay in Form View. Click Cancel again with no edits → you return to the grid.

---

## Final: Commit on a branch (end of task only)

Once all tasks pass and the user approves, create the branch and commit everything together:
```bash
git checkout -b hotfix/ETP-4369
git add -A   # (or the specific staged files)
git commit -m "Hotfix ETP-4369: Cancel button discards changes before navigating"
```
(Hotfix branches target `main`/`master` per Git Police rules.)

## Out of scope

- No confirmation dialog before discarding.
- No change to Save / Refresh toolbar actions.
- No change to Escape's user-visible behavior (only repointed to `navigateBack` to preserve it).
