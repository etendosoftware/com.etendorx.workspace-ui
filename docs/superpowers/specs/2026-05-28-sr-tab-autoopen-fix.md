# SR Tab Auto-Open Regression — Investigation & Fix Context

## The Bug

SR (Single Record) tabs like **Customer** and **Vendor/Creditor** in the **Business Partner** window should auto-open in form view when a parent record is selected. Instead, they show an empty grid.

## What SR Tabs Are

SR tabs have `uIPattern: "SR"` (mapped to `UIPattern.EDIT_ONLY`) and `defaultEditMode: true`. They represent a 1:1 relationship where the child record shares the same entity and ID as the parent. Examples:
- Business Partner > **Customer** tab (tab 223) — same entity `BusinessPartner`, same record ID
- Business Partner > **Vendor/Creditor** tab — same entity, same record ID
- Client > **Client Information** tab — `AD_ClientInfo`, PK = FK to parent

In Classic, these tabs **never show a grid**. They go directly to form view displaying the parent's record.

## Root Causes Found (Two Separate Issues)

### Issue 1: Wrong datasource criteria for SR tabs

**File:** `packages/MainUI/utils/criteriaUtils.ts` and `packages/MainUI/hooks/table/useTableData.tsx`

The datasource query for Customer/Vendor tabs sends the WRONG filter:
```
criteria: { fieldName: "salesRepresentative", value: "<parentId>", operator: "equals" }
```

Should send (like Classic):
```
criteria: { fieldName: "id", value: "<parentId>", operator: "equals" }
```

**Why:** `getParentFieldName()` in `useTableData.tsx:417-425` only detects SR tabs when `parentColumns` is empty. But Customer/Vendor tabs have non-empty `parentColumns`, so they fall through to `resolveParentFieldName()` which picks the wrong field.

**Fix needed:** Move the SR check (`tab.uIPattern === UIPattern.EDIT_ONLY && parentTab`) BEFORE the `parentColumns.length === 0` check, so SR tabs always use `fieldName: "id"`.

Additionally, `buildBaseCriteria()` in `criteriaUtils.ts:111` converts `fieldName: "id"` to `_dummy` (to avoid filtering child table by its own PK). But for SR tabs, `id = parentId` IS correct because they share the same entity. Add an SR exception before that guard.

### Issue 2: Reset effect clears form state on initial mount

**File:** `packages/MainUI/components/window/Tab.tsx:195-211`

Commit `90433c133` ("Reset child tab when parent record changes") added a `useEffect` that clears child tab state when the parent changes. But the condition `prev === undefined && parentSelectedRecordId === undefined` doesn't skip the initial mount when `parentSelectedRecordId` already has a value. On first mount with a selected parent, `prev=undefined` and `parentSelectedRecordId=<value>`, so the effect fires and clears everything — including the form state that the auto-open just set.

**Fix needed:** Change the initial-mount guard from:
```typescript
if (prev === undefined && parentSelectedRecordId === undefined) return;
```
To:
```typescript
if (prev === undefined) return;
```

This skips the effect entirely on mount (prev is always undefined on first render), only reacting to actual parent changes afterward.

## Architecture Insight: The Right Approach for SR Tabs

The current approach tries to: load grid → wait for records → auto-open form. This is fragile because of timing issues between the reset effect, datasource loading, and auto-open effects.

**The better approach** (what Classic does): SR tabs should show form view as their DEFAULT, not as an auto-open afterthought. This means:

1. `shouldShowForm` should be `true` by default for SR tabs when parent has selection
2. `currentRecordId` should fall back to `parentSelectedRecordId` for SR tabs (since they share the same entity/record)
3. The reset effect should skip SR tabs — their `effectiveRecordId` updates naturally when parent changes

Specifically:
```typescript
// After parentSelectedRecordId is defined (~line 192):
const isSrTab = tab.uIPattern === UIPattern.EDIT_ONLY && tab.defaultEditMode;
const effectiveRecordId = isSrTab && parentSelectedRecordId
  ? (currentRecordId || parentSelectedRecordId)
  : currentRecordId;

const isSrDefaultForm = isSrTab && parentHasSelection;
const shouldShowForm =
  isSrDefaultForm || hasFormViewState || isFormView({...});

// In the reset effect: skip for SR tabs
if (isSrTab) return;

// FormView receives effectiveRecordId instead of currentRecordId
<FormView recordId={effectiveRecordId} ... />
```

**IMPORTANT:** The `isSrTab` / `isSrDefaultForm` variables and `effectiveRecordId` must be defined AFTER `parentSelectedRecordId` (line 192) to avoid "used before initialization" errors.

## What We Tried and Why It Failed

1. **Just fixing the initial mount guard** — Fixed mount but auto-open still didn't work because the datasource returned 0 records (Issue 1)
2. **Fixing datasource criteria** — Records loaded, auto-open worked first time, but `srAutoOpenedForParentRef` in Table/index.tsx wasn't reset on parent change → subsequent parent changes didn't auto-open
3. **Adding ref reset in Table/index.tsx** — Helped but race conditions between reset effect and auto-open persisted
4. **Making shouldShowForm default to true for SR tabs** — Worked! But `currentRecordId` was empty (no form state) → FormView had no record to load. Fixed by adding `effectiveRecordId` fallback to parentId
5. **Adding srFormDismissed state for "user closes form"** — Didn't work because `clearTabFormState` from the reset effect looked the same as user closing form
6. **Skipping reset effect for SR tabs** — Broke non-SR child tab behavior because the condition was too broad

The fundamental issue: each fix solved one symptom but revealed another interaction. The correct fix needs to address BOTH issues atomically:
- Fix the datasource criteria (Issue 1) so records load
- Fix the shouldShowForm default (architecture fix) so the form shows immediately
- Skip the reset effect for SR tabs so it doesn't interfere
- Keep the reset effect working for non-SR child tabs

## Files to Modify

| File | Change |
|------|--------|
| `packages/MainUI/hooks/table/useTableData.tsx:417-425` | Move SR check before parentColumns check |
| `packages/MainUI/utils/criteriaUtils.ts:94-119` | Add SR exception before the `fieldName === "id"` → `_dummy` guard |
| `packages/MainUI/components/window/Tab.tsx:187-215` | Add `effectiveRecordId`, `isSrDefaultForm`, skip reset for SR, pass `effectiveRecordId` to FormView |

## How to Verify

1. Open Business Partner window
2. Select a BP → Customer tab should show form view immediately with correct data
3. Select another BP → Customer tab should update to new BP's data without flash
4. Repeat for Vendor/Creditor tab
5. Open Sales Order → Lines tab should still work normally (non-SR child tab)
6. Open Client > Client Information (SR 1:1 extension tab) — should also work

## Original Implementation Reference

The SR feature was originally implemented in `feature/ETP-3350`:
- Commit `db1c6f84f` — Initial SR visualization
- Commit `63ba9b156` — Added `defaultEditMode` check and `srAutoOpenedForParentRef`
- Commit `2c434e246` (ETP-3740) — Split into 1:1 extension (Tab.tsx) vs logical SR (Table/index.tsx)
- Commit `90433c133` (ETP-3931) — Added reset effect that introduced the regression

## Current State of Files (after revert)

All four files are at their HEAD state (no uncommitted changes). The fixes need to be applied fresh.
