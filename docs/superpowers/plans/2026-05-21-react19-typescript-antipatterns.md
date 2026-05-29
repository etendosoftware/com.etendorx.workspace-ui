# React 19 + TypeScript Anti-Patterns Fix Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix high-severity anti-patterns identified by React 19 and TypeScript skill analysis — bugs, performance issues, and type safety gaps.

**Architecture:** Incremental fixes grouped by severity. Each task is a standalone commit touching a small set of files. No behavioral changes — only correctness and type safety improvements.

**Tech Stack:** React 19, TypeScript, Material-UI, Next.js

---

## Task 1: Fix `key={index}` in dynamic lists (HIGH — real state bugs)

**Files:**
- Modify: `packages/ComponentLibrary/src/components/SearchModal/SubComponents/DefaultContent/index.tsx:27-35`
- Modify: `packages/ComponentLibrary/src/components/SearchModal/SubComponents/SectionContent/index.tsx:42-43`
- Modify: `packages/ComponentLibrary/src/components/SearchModal/SubComponents/TabContent/index.tsx:26-28`
- Modify: `packages/ComponentLibrary/src/components/SecondaryTabs/index.tsx:89-92`

- [ ] **Step 1: Fix DefaultContent — use section.title and item.name as keys**

In `DefaultContent/index.tsx`, the `Item` type has a `name: string` field and `Section` has a `title: string`. Use these as stable keys:

```tsx
// Line 28: change key={index} to key={section.title}
<Box key={section.title} sx={styles.sectionContainer}>

// Line 35: change key={itemIndex} to key={item.name}
<Box key={item.name} sx={styles.itemBox}>
```

- [ ] **Step 2: Fix SectionContent — use item.name as key**

In `SectionContent/index.tsx` line 43:

```tsx
// change key={index} to key={item.name}
<ItemContent key={item.name} item={item} />
```

- [ ] **Step 3: Fix TabContent — use tab.label as key**

In `TabContent/index.tsx` line 28:

```tsx
// change key={index} to key={tab.label}
<SectionContent
  key={tab.label}
  section={{ title: tab.label, items: tab.items }}
```

- [ ] **Step 4: Fix SecondaryTabs — use tab.label as key in renderTab AND hiddenTabs**

In `SecondaryTabs/index.tsx` line 92, `renderTab` receives `(tab: TabContent, index: number)`. Change to use `tab.label`:

```tsx
const renderTab = useCallback(
  (tab: TabContent, index: number) => (
    <Tab
      key={tab.label}
```

Also fix the `hiddenTabs.map` at line 129 (missed in initial analysis):

```tsx
// Line 129: change key={index} to key={tab.label}
{hiddenTabs.map((tab: TabContent, index: number) => (
  <MenuItem
    key={tab.label}
```

**Note:** `tab.label`, `item.name`, and `section.title` are assumed unique within their respective lists (menu items/sections have unique display names). If duplicates are possible, use compound keys like `` `${item.name}-${index}` `` as fallback.

- [ ] **Step 5: Run tests and verify**

Run: `pnpm test:component-library`
Expected: All tests pass, no regressions.

- [ ] **Step 6: Commit**

```bash
git add packages/ComponentLibrary/src/components/SearchModal packages/ComponentLibrary/src/components/SecondaryTabs/index.tsx
git commit -m "fix: replace index keys with stable identifiers in dynamic lists"
```

---

## Task 2: Fix `JSON.stringify` dependency anti-pattern (HIGH — lint smell, reference instability)

**Files:**
- Modify: `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx:574-577`

- [ ] **Step 1: Replace JSON.stringify useMemo dependency with useRef-based deep compare**

The current pattern uses `JSON.stringify(rawFormValues)` as a useMemo dependency, which is unconventional and creates a new string every render. Replace with a ref-based approach that preserves reference identity when values haven't changed:

```tsx
// Remove:
// const formValues = useMemo(() => rawFormValues, [JSON.stringify(rawFormValues)]);

// Replace with:
const formValuesRef = useRef(rawFormValues);
if (JSON.stringify(formValuesRef.current) !== JSON.stringify(rawFormValues)) {
  formValuesRef.current = rawFormValues;
}
const formValues = formValuesRef.current;
```

Note: `useRef` is already imported at line 31. No import changes needed.

The key improvement: the useMemo with `JSON.stringify` as a dep is a React anti-pattern (deps should be stable references). The ref approach achieves the same deep-compare goal with an idiomatic pattern. Both stringify on every render, but the ref version doesn't abuse the dependency array.

- [ ] **Step 2: Remove the eslint-disable comment**

Remove the `// eslint-disable-next-line react-hooks/exhaustive-deps` comment on line 576 since it's no longer needed.

- [ ] **Step 3: Run tests**

Run: `pnpm test:mainui`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx
git commit -m "fix: replace JSON.stringify dependency with ref-based deep compare in ProcessDefinitionModal"
```

---

## Task 3: Fix missing `logout` dependency in UserContext useMemo (HIGH for `logout` — stale closure; LOW for setters — lint compliance)

**Files:**
- Modify: `packages/MainUI/contexts/user.tsx:288-313`

- [ ] **Step 1: Add `logout` and `setSession` to dependency array**

The context value includes `logout`, `setSession`, and `setSessionSyncLoading` but they are missing from the deps array. `logout` is a `useCallback` that depends on `clearUserData` — this is a genuine stale closure risk. `setSession` and `setSessionSyncLoading` are `useState` setters (stable by React guarantee) — adding them is for lint compliance and best practice, not a runtime bug.

Add the missing dependencies at lines 288-313:

```tsx
  [
    login,
    logout,              // ADD — was missing
    roles,
    currentRole,
    profile,
    changeProfile,
    changePassword,
    currentWarehouse,
    currentClient,
    currentOrganization,
    token,
    clearUserData,
    setToken,
    setDefaultConfiguration,
    languages,
    session,
    setSession,          // ADD — was missing
    user,
    prevRole,
    isSessionSyncLoading,
    setSessionSyncLoading, // ADD — was missing
    isCopilotInstalled,
    setIsCopilotInstalled,
    loginErrorText,
    setLoginErrorText,
    loginErrorDescription,
    setLoginErrorDescription,
  ]
```

- [ ] **Step 2: Remove unnecessary `as any` on session.csrfToken**

At line 286, `ISession extends Record<string, string | number | boolean | null>`, so `.csrfToken` is already valid via the index signature. Change:

```tsx
// Before:
getCsrfToken: () => (session as any).csrfToken || localStorage.getItem("csrfToken") || "",

// After:
getCsrfToken: () => (session.csrfToken as string) || localStorage.getItem("csrfToken") || "",
```

- [ ] **Step 3: Run tests**

Run: `pnpm test:mainui`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/MainUI/contexts/user.tsx
git commit -m "fix: add missing dependencies to UserContext useMemo and remove unnecessary as any"
```

---

## Task 4: Remove refs from useMemo dependency array in TabsContext (MEDIUM — unnecessary re-renders)

**Files:**
- Modify: `packages/MainUI/contexts/tabs.tsx:180-189`

- [ ] **Step 1: Remove stable refs from dependency array**

`containerRef` and `windowsContainerRef` are `useRef` values — they are stable across renders and should not be in the deps array:

```tsx
  const value = useMemo<TabsContextType>(
    () => ({
      containerRef: containerRef as React.RefObject<HTMLDivElement>,
      windowsContainerRef: windowsContainerRef as React.RefObject<HTMLDivElement>,
      tabRefs,
      showLeftScrollButton,
      showRightScrollButton,
      showRightMenuButton,
      handleScrollLeft,
      handleScrollRight,
    }),
    [
      // containerRef removed — refs are stable
      // windowsContainerRef removed — refs are stable
      tabRefs,
      showLeftScrollButton,
      showRightScrollButton,
      showRightMenuButton,
      handleScrollLeft,
      handleScrollRight,
    ]
  );
```

- [ ] **Step 2: Run tests**

Run: `pnpm test:mainui`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/contexts/tabs.tsx
git commit -m "fix: remove stable refs from TabsContext useMemo dependency array"
```

---

## Task 5: Replace `forwardRef` with ref-as-prop (MEDIUM — React 19 migration)

**Files:**
- Modify: `packages/ComponentLibrary/src/components/BasicModal/index.tsx:18,30-54`
- Modify: `packages/ComponentLibrary/src/components/BasicModal/types.ts` (add ref to interface)

- [ ] **Step 1: Update ModalIProps to include ref**

In the types file, add `ref` to the props interface:

```tsx
import type { Ref } from "react";

export interface ModalIProps {
  // ... existing props ...
  ref?: Ref<HTMLDivElement>;
}
```

- [ ] **Step 2: Replace forwardRef with regular function component**

In `BasicModal/index.tsx`:

```tsx
// Before (line 18):
import React, { useCallback, useState, useRef, useEffect, forwardRef, useMemo } from "react";

// After (keep cloneElement since it's used at line 155 for customTrigger):
import { cloneElement, useCallback, useState, useRef, useEffect, useMemo, type ReactElement } from "react";
```

Also update the `React.cloneElement` call at line 155:

```tsx
// Before:
return React.cloneElement(customTrigger as React.ReactElement<{ onClick?: () => void }>, {

// After:
return cloneElement(customTrigger as ReactElement<{ onClick?: () => void }>, {
```

```tsx
// Before (line 30):
const Modal = forwardRef<HTMLDivElement, ModalIProps>(
  (
    {
      height = Container.Auto,
      // ... props destructure ...
      open: externalOpen,
    },
    ref
  ) => {

// After:
const Modal = ({
  height = Container.Auto,
  // ... props destructure ...
  open: externalOpen,
  ref,
}: ModalIProps) => {
```

Remove the extra closing `)` at the end of the component that matches the `forwardRef(` call.

- [ ] **Step 3: Run component library tests**

Run: `pnpm test:component-library`
Expected: All BasicModal tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/ComponentLibrary/src/components/BasicModal/
git commit -m "refactor: replace forwardRef with ref-as-prop in BasicModal (React 19)"
```

---

## Task 6: Fix `import React from 'react'` default imports (LOW — React 19 convention)

**Files (non-test, production code only):**
- Modify: `packages/ComponentLibrary/src/components/DragModal/SortableItem.tsx`
- Modify: `packages/ComponentLibrary/src/components/Tab/index.tsx`
- Modify: `packages/MainUI/components/Table/CellEditors/CellEditorFactory.tsx`

- [ ] **Step 1a: Fix `DragModal/SortableItem.tsx`**

Uses `React.FC`, `React.cloneElement`, `React.ReactElement`, `React.CSSProperties`:

```tsx
// Before:
import React from "react";

// After:
import { cloneElement, type FC, type ReactElement, type CSSProperties } from "react";
```

Then update body references:
- `React.FC<SortableItemProps>` → `FC<SortableItemProps>`
- `React.cloneElement(icon as React.ReactElement<{ style?: React.CSSProperties }>` → `cloneElement(icon as ReactElement<{ style?: CSSProperties }>`

- [ ] **Step 1b: Fix `Tab/index.tsx`**

Uses `React.useState`, `React.SyntheticEvent`:

```tsx
// Before:
import * as React from "react";

// After:
import { useState, type SyntheticEvent } from "react";
```

Then update body references:
- `React.useState("0")` → `useState("0")`
- `React.SyntheticEvent` → `SyntheticEvent`

- [ ] **Step 1c: Fix `CellEditorFactory.tsx`**

Uses `React.FC`, `React.memo`:

```tsx
// Before:
import React from "react";

// After:
import { memo, type FC } from "react";
```

Then update body references:
- `React.FC<CellEditorFactoryProps>` → `FC<CellEditorFactoryProps>`
- `React.memo(CellEditorFactoryComponent, ...)` → `memo(CellEditorFactoryComponent, ...)`

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add packages/ComponentLibrary/src/components/DragModal/SortableItem.tsx packages/ComponentLibrary/src/components/Tab/index.tsx packages/MainUI/components/Table/CellEditors/CellEditorFactory.tsx
git commit -m "refactor: replace default React imports with named imports (React 19)"
```

---

## Out of Scope (documented for future work)

These issues are real but require larger, coordinated efforts:

1. **176 useMemo/useCallback instances** — Removing these requires enabling React Compiler first. Without the compiler, removing them could regress performance. Prerequisite: enable `react-compiler` in `next.config.ts` and verify build stability.

2. **135+ `any` types** — Requires module augmentation for MUI theme types and gradual migration. Too many files for a single PR.

3. **50+ inline nested interfaces in `api-client/src/api/types.ts`** — Major type refactor that touches the core API types used across all packages. Needs its own dedicated PR with careful review.

4. **6+ union types without const objects** — Low risk, low urgency. Can be addressed file-by-file in future PRs.
