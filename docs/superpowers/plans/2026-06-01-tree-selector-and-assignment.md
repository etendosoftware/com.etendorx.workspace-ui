# Tree Selector & Assignment Reference — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two missing field reference types — Assignment (ref 33) mapped to TableDirSelector, and Tree Reference (ref 8C57...) with a new hierarchical TreeSelector component.

**Architecture:** Assignment is a simple constant + switch case addition. Tree Reference requires a pure utility (`treeUtils.ts`) to transform flat datasource records into a depth-annotated list, and a new `TreeSelector` component that renders a dropdown with indented tree nodes. TreeSelector reuses `useTableDirDatasource` for data fetching, `useSelectFieldOptions` for option building, and the existing `DropdownPortal`/`useDropdownPosition`/`SearchInput` infrastructure for the dropdown UI.

**Tech Stack:** React 19, TypeScript, react-hook-form, Tailwind CSS, Jest

**Spec:** `docs/superpowers/specs/2026-06-01-tree-selector-and-assignment-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `packages/MainUI/utils/form/treeUtils.ts` | **New** — Pure `buildFlatTreeList()` function: takes flat EntityData[] with parentId, returns depth-annotated TreeNode[] |
| `packages/MainUI/utils/form/__tests__/treeUtils.test.ts` | **New** — Unit tests for tree utility |
| `packages/MainUI/components/Form/FormView/selectors/TreeSelector.tsx` | **New** — Tree-aware dropdown selector component |
| `packages/MainUI/utils/form/constants.ts` | **Modify** — Add ASSIGNMENT and TREE_REFERENCE to FIELD_REFERENCE_CODES |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | **Modify** — Add switch cases routing to TableDirSelector and TreeSelector |

---

### Task 1: Tree Hierarchy Utility — Tests

**Files:**
- Create: `packages/MainUI/utils/form/__tests__/treeUtils.test.ts`

**Note:** All new files must include the Etendo license header. See any existing file (e.g. `packages/MainUI/utils/form/constants.ts` lines 1-16) for the exact header text. The code blocks below omit it for brevity but it MUST be included.

- [ ] **Step 1: Write the test file for buildFlatTreeList**

```typescript
import { buildFlatTreeList } from "../treeUtils";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

describe("buildFlatTreeList", () => {
  it("should return empty array for empty input", () => {
    expect(buildFlatTreeList([])).toEqual([]);
  });

  it("should handle flat records with no parents", () => {
    const records: EntityData[] = [
      { id: "A", _identifier: "Alpha" },
      { id: "B", _identifier: "Beta" },
    ];
    const result = buildFlatTreeList(records);
    expect(result).toEqual([
      expect.objectContaining({ id: "A", depth: 0, hasChildren: false }),
      expect.objectContaining({ id: "B", depth: 0, hasChildren: false }),
    ]);
  });

  it("should nest children under parents using parentId", () => {
    const records: EntityData[] = [
      { id: "ROOT", _identifier: "Root", isCharacteristic: true },
      { id: "CHILD1", _identifier: "Child 1", parentId: "ROOT" },
      { id: "CHILD2", _identifier: "Child 2", parentId: "ROOT" },
    ];
    const result = buildFlatTreeList(records);
    expect(result).toEqual([
      expect.objectContaining({ id: "ROOT", depth: 0, hasChildren: true }),
      expect.objectContaining({ id: "CHILD1", depth: 1, hasChildren: false }),
      expect.objectContaining({ id: "CHILD2", depth: 1, hasChildren: false }),
    ]);
  });

  it("should handle multi-level nesting (3+ levels)", () => {
    const records: EntityData[] = [
      { id: "L0", _identifier: "Level 0" },
      { id: "L1", _identifier: "Level 1", parentId: "L0" },
      { id: "L2", _identifier: "Level 2", parentId: "L1" },
    ];
    const result = buildFlatTreeList(records);
    expect(result).toEqual([
      expect.objectContaining({ id: "L0", depth: 0, hasChildren: true }),
      expect.objectContaining({ id: "L1", depth: 1, hasChildren: true }),
      expect.objectContaining({ id: "L2", depth: 2, hasChildren: false }),
    ]);
  });

  it("should treat orphan records as roots", () => {
    const records: EntityData[] = [
      { id: "ORPHAN", _identifier: "Orphan", parentId: "NONEXISTENT" },
      { id: "ROOT", _identifier: "Root" },
    ];
    const result = buildFlatTreeList(records);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ depth: 0 });
    expect(result[1]).toMatchObject({ depth: 0 });
  });

  it("should not infinite-loop on circular references", () => {
    const records: EntityData[] = [
      { id: "A", _identifier: "A", parentId: "B" },
      { id: "B", _identifier: "B", parentId: "A" },
    ];
    // Should not hang — both treated as roots since neither has a valid non-circular ancestor
    const result = buildFlatTreeList(records);
    expect(result).toHaveLength(2);
  });

  it("should handle single node", () => {
    const records: EntityData[] = [{ id: "ONLY", _identifier: "Only Node" }];
    const result = buildFlatTreeList(records);
    expect(result).toEqual([
      expect.objectContaining({ id: "ONLY", depth: 0, hasChildren: false }),
    ]);
  });

  it("should preserve all original record properties", () => {
    const records: EntityData[] = [
      { id: "A", _identifier: "A", isCharacteristic: true, showOpenIcon: true, customProp: "val" },
    ];
    const result = buildFlatTreeList(records);
    expect(result[0]).toMatchObject({
      id: "A",
      _identifier: "A",
      isCharacteristic: true,
      showOpenIcon: true,
      customProp: "val",
      depth: 0,
      hasChildren: false,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:mainui -- --testPathPattern="treeUtils" --verbose`
Expected: FAIL — `Cannot find module '../treeUtils'`

- [ ] **Step 3: Commit the failing test**

```bash
git add packages/MainUI/utils/form/__tests__/treeUtils.test.ts
git commit -m "Feature ETP-3754: Add failing tests for buildFlatTreeList utility"
```

---

### Task 2: Tree Hierarchy Utility — Implementation

**Files:**
- Create: `packages/MainUI/utils/form/treeUtils.ts`

- [ ] **Step 1: Implement buildFlatTreeList**

```typescript
import type { EntityData } from "@workspaceui/api-client/src/api/types";

export interface TreeNode extends EntityData {
  depth: number;
  hasChildren: boolean;
}

/**
 * Transforms a flat array of records with parentId references into a
 * depth-annotated flat list suitable for rendering an indented tree dropdown.
 *
 * Root detection: a record is a root when its parentId is falsy OR
 * references an ID not present in the dataset (orphan).
 *
 * Walks depth-first so children appear directly after their parent.
 * Tracks visited nodes to prevent infinite loops from circular references.
 */
export function buildFlatTreeList(records: EntityData[]): TreeNode[] {
  if (records.length === 0) return [];

  const idSet = new Set(records.map((r) => r.id as string));
  const childrenMap = new Map<string, EntityData[]>();
  const roots: EntityData[] = [];

  for (const record of records) {
    const parentId = record.parentId as string | undefined;
    if (!parentId || !idSet.has(parentId)) {
      roots.push(record);
    } else {
      const siblings = childrenMap.get(parentId) ?? [];
      siblings.push(record);
      childrenMap.set(parentId, siblings);
    }
  }

  const result: TreeNode[] = [];
  const visited = new Set<string>();

  const walk = (nodes: EntityData[], depth: number) => {
    for (const node of nodes) {
      const nodeId = node.id as string;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const children = childrenMap.get(nodeId) ?? [];
      result.push({
        ...node,
        depth,
        hasChildren: children.length > 0,
      });
      if (children.length > 0) {
        walk(children, depth + 1);
      }
    }
  };

  walk(roots, 0);

  // Any unvisited records (from circular references) are added as roots
  for (const record of records) {
    if (!visited.has(record.id as string)) {
      result.push({ ...record, depth: 0, hasChildren: false });
    }
  }

  return result;
}
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `pnpm test:mainui -- --testPathPattern="treeUtils" --verbose`
Expected: All 7 tests PASS

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/utils/form/treeUtils.ts
git commit -m "Feature ETP-3754: Implement buildFlatTreeList tree hierarchy utility"
```

---

### Task 3: Add ASSIGNMENT and TREE_REFERENCE Constants

**Files:**
- Modify: `packages/MainUI/utils/form/constants.ts:114-118` (after LINK entry, before PRODUCT_CHARACTERISTICS)

- [ ] **Step 1: Add the new reference codes to FIELD_REFERENCE_CODES**

In `packages/MainUI/utils/form/constants.ts`, add these entries after the `LINK` entry (line 113) and before `PRODUCT_CHARACTERISTICS` (line 117):

```typescript
  // Assignment — resource assignment FK (ref 33 in Classic).
  // Uses TableDirDomainType in Classic; mapped to TableDirSelector.
  ASSIGNMENT: { id: "33", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },

  // Tree Reference — hierarchical FK selector (e.g. Characteristic Values)
  TREE_REFERENCE: { id: "8C57A4A2E05F4261A1FADF47C30398AD", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE },
```

- [ ] **Step 2: Run lint to verify**

Run: `pnpm lint -- packages/MainUI/utils/form/constants.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/utils/form/constants.ts
git commit -m "Feature ETP-3754: Add Assignment and Tree Reference to FIELD_REFERENCE_CODES"
```

---

### Task 4: TreeSelector Component

**Files:**
- Create: `packages/MainUI/components/Form/FormView/selectors/TreeSelector.tsx`

**Note:** Include the Etendo license header (same as other files in the selectors/ directory).

- [ ] **Step 1: Create the TreeSelector component**

Write the complete file below to `packages/MainUI/components/Form/FormView/selectors/TreeSelector.tsx`.
This follows the `Select.tsx` pattern (trigger div + `DropdownPortal`) but replaces flat option rendering with indented tree nodes.

```typescript
// @data-testid-ignore
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import ChevronDown from "@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg";
import ChevronRight from "@workspaceui/componentlibrary/src/assets/icons/chevron-right.svg";
import XIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check-circle-filled.svg";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";
import { useSelectFieldOptions } from "@/hooks/useSelectFieldOptions";
import { buildFlatTreeList, type TreeNode } from "@/utils/form/treeUtils";
import { updateSelectorValue } from "@/utils/form/selectors/utils";
import { useDropdownPosition } from "@/components/Form/FormView/selectors/hooks/useDropdownPosition";
import DropdownPortal from "@/components/Form/FormView/selectors/components/Select/DropdownPortal";
import {
  handleKeyboardActivation,
  useFocusHandler,
  useHoverHandlers,
  useOpenDropdownEffect,
  useSearchHandler,
  useSearchTermHandler,
} from "@/utils/selectorUtils";
import { useTranslation } from "@/hooks/useTranslation";

interface TreeSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

const isNodeSelectable = (node: TreeNode): boolean => !node.isCharacteristic;

function TreeSelectorCmp({ field, isReadOnly }: TreeSelectorProps) {
  const { t } = useTranslation();
  const { register, setValue, watch } = useFormContext();
  const fieldName = field.hqlName || field.columnName || field.name;
  const selectedValue = watch(fieldName);
  const currentIdentifier = watch(`${fieldName}$_identifier`);

  // --- Data fetching (same pattern as TableDirSelector) ---
  const { records, loading, refetch } = useTableDirDatasource({ field });
  const options = useSelectFieldOptions(field, records);

  // --- Build tree from flat options ---
  const treeNodes = useMemo(() => {
    const recordData = options
      .filter((opt) => opt.data && Object.keys(opt.data).length > 0)
      .map((opt) => opt.data!);
    return buildFlatTreeList(recordData);
  }, [options]);

  // Lookup map for O(1) parent resolution in filters
  const nodeMap = useMemo(() => {
    const map = new Map<string, TreeNode>();
    for (const node of treeNodes) {
      map.set(node.id as string, node);
    }
    return map;
  }, [treeNodes]);

  // --- UI state ---
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedLabel, setSelectedLabel] = useState("");

  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownId = useMemo(() => `tree-dropdown-${fieldName}`, [fieldName]);

  const handleSearchChange = useSearchHandler();

  // --- Visible nodes: search filter + collapse filter ---
  const visibleNodes = useMemo(() => {
    let filtered = treeNodes;

    if (searchTerm) {
      // Search: keep matches + their ancestor chain for context
      const lowerSearch = searchTerm.toLowerCase();
      const matchIds = new Set(
        treeNodes
          .filter((n) => (n._identifier as string).toLowerCase().includes(lowerSearch))
          .map((n) => n.id as string)
      );
      const keepIds = new Set(matchIds);
      for (const node of treeNodes) {
        if (matchIds.has(node.id as string)) {
          let current: TreeNode | undefined = node;
          while (current?.parentId && typeof current.parentId === "string") {
            keepIds.add(current.parentId);
            current = nodeMap.get(current.parentId);
          }
        }
      }
      filtered = filtered.filter((n) => keepIds.has(n.id as string));
    } else {
      // No search: apply collapse filter — hide children of collapsed parents
      filtered = filtered.filter((node) => {
        let parentId = node.parentId as string | undefined;
        while (parentId) {
          if (collapsedNodes.has(parentId)) return false;
          const parent = nodeMap.get(parentId);
          parentId = parent?.parentId as string | undefined;
        }
        return true;
      });
    }

    return filtered;
  }, [treeNodes, searchTerm, collapsedNodes, nodeMap]);

  // --- Selectable nodes only (for keyboard nav index) ---
  const selectableIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < visibleNodes.length; i++) {
      if (isNodeSelectable(visibleNodes[i])) {
        indices.push(i);
      }
    }
    return indices;
  }, [visibleNodes]);

  // --- Toggle collapse ---
  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // --- Selection ---
  const handleSelect = useCallback(
    (node: TreeNode) => {
      if (!isNodeSelectable(node)) return;
      const nodeId = node.id as string;
      updateSelectorValue(setValue, fieldName, nodeId, node);
      setSelectedLabel(node._identifier as string);
      setIsOpen(false);
      setHighlightedIndex(-1);
      setIsFocused(false);
    },
    [fieldName, setValue]
  );

  // --- Keyboard navigation (skips non-selectable nodes) ---
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (selectableIndices.length === 0) return;
        setHighlightedIndex((prev) => {
          const currentPos = selectableIndices.indexOf(prev);
          const nextPos = currentPos < 0 ? 0 : (currentPos + 1) % selectableIndices.length;
          return selectableIndices[nextPos];
        });
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selectableIndices.length === 0) return;
        setHighlightedIndex((prev) => {
          const currentPos = selectableIndices.indexOf(prev);
          const nextPos = currentPos <= 0 ? selectableIndices.length - 1 : currentPos - 1;
          return selectableIndices[nextPos];
        });
        return;
      }

      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const node = visibleNodes[highlightedIndex];
        if (node) {
          if (isNodeSelectable(node)) {
            handleSelect(node);
          } else if (node.hasChildren) {
            toggleCollapse(node.id as string);
          }
        }
      }
    },
    [visibleNodes, highlightedIndex, selectableIndices, handleSelect, toggleCollapse]
  );

  // --- Dropdown open/close ---
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setIsFocused(false);
    setCollapsedNodes(new Set()); // reset collapse state
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isReadOnly) {
        setIsOpen((prev) => !prev);
        setIsFocused(true);
      }
    },
    [isReadOnly]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setValue(`${fieldName}$_identifier`, "", { shouldDirty: false });
      setValue(`${fieldName}_data`, null);
      setValue(fieldName, "", { shouldDirty: true, shouldValidate: true });
      setSelectedLabel("");
    },
    [fieldName, setValue]
  );

  // --- Blur / click-outside ---
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      const relatedTarget = e.relatedTarget as Element | null;
      if (relatedTarget?.closest(`[data-dropdown-portal="${dropdownId}"]`)) return;
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isInPortal = activeElement?.closest(`[data-dropdown-portal="${dropdownId}"]`);
        const isInWrapper = wrapperRef.current?.contains(activeElement);
        if (!isInPortal && !isInWrapper) closeDropdown();
      }, 150);
    },
    [closeDropdown, dropdownId]
  );

  const handleSearchBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const relatedTarget = e.relatedTarget as Element | null;
      if (wrapperRef.current?.contains(relatedTarget)) return;
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isInPortal = activeElement?.closest(`[data-dropdown-portal="${dropdownId}"]`);
        const isInWrapper = wrapperRef.current?.contains(activeElement);
        if (!isInPortal && !isInWrapper) closeDropdown();
      }, 150);
    },
    [closeDropdown, dropdownId]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInWrapper = wrapperRef.current?.contains(target);
      const isInPortal = target.closest(`[data-dropdown-portal="${dropdownId}"]`);
      if (!isInWrapper && !isInPortal) closeDropdown();
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeDropdown, dropdownId]);

  // --- Shared hooks ---
  const { handleMouseEnter, handleMouseLeave } = useHoverHandlers(setIsHovering);
  const handleFocus = useFocusHandler(refetch);
  const handleSetSearchTerm = useSearchTermHandler(handleSearchChange, setSearchTerm);
  const handleScroll = useCallback(() => {}, []); // no infinite scroll for tree data
  const dropdownViewportData = useDropdownPosition(isOpen, triggerRef as React.RefObject<HTMLDivElement>);

  useOpenDropdownEffect(
    isOpen,
    setSearchTerm,
    setHighlightedIndex,
    searchInputRef as React.RefObject<HTMLInputElement>
  );

  // --- Sync selected label from form state ---
  useEffect(() => {
    const node = treeNodes.find((n) => (n.id as string) === selectedValue);
    setSelectedLabel(node ? (node._identifier as string) : currentIdentifier || selectedValue || "");
  }, [selectedValue, treeNodes, currentIdentifier]);

  // --- Scroll highlighted into view ---
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // --- Trigger styles (same as Select.tsx) ---
  const mainDivClassNames = useMemo(() => {
    const base =
      "w-full flex items-center justify-between px-3 pr-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 transition-colors outline-none";
    if (isReadOnly) {
      return `${base} bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent focus:border-dotted focus:border-(--color-transparent-neutral-70) focus:bg-transparent focus:text-(--color-transparent-neutral-80)`;
    }
    const active = "border-[#004ACA] text-[#004ACA] bg-[#E5EFFF]";
    const hover = "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)";
    const focus = "focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none cursor-pointer";
    const interactive = isFocused || isOpen ? active : hover;
    return `${base} bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 ${interactive} ${focus}`;
  }, [isReadOnly, isFocused, isOpen]);

  const labelClassNames = useMemo(() => {
    const base = "text-sm truncate max-w-[calc(100%-40px)] font-medium";
    if (!selectedLabel) return `${base} text-baseline-60`;
    const isActive = (isFocused || isOpen) && !isReadOnly;
    return `${base} ${isActive ? "text-[#004ACA]" : "text-(--color-transparent-neutral-80)"}`;
  }, [selectedLabel, isFocused, isOpen, isReadOnly]);

  const chevronClassNames = useMemo(() => {
    const base = "w-5 h-5 transition-transform";
    const isActive = isFocused || isOpen;
    return `${base} ${isActive ? "text-(--color-baseline-100) rotate-180" : "text-(--color-transparent-neutral-60)"}`;
  }, [isFocused, isOpen]);

  const shouldShowClearButton = selectedLabel && (isHovering || isOpen) && !isReadOnly;

  // --- Rendered tree options ---
  const renderedOptions = useMemo(() => {
    if (loading && visibleNodes.length === 0) {
      return <li className="px-4 py-3 text-sm text-baseline-60">Loading...</li>;
    }
    if (visibleNodes.length === 0) {
      return <li className="px-4 py-3 text-sm text-baseline-60">No options found</li>;
    }

    return visibleNodes.map((node, index) => {
      const nodeId = node.id as string;
      const identifier = node._identifier as string;
      const selectable = isNodeSelectable(node);
      const isSelected = selectedValue === nodeId;
      const isHighlighted = highlightedIndex === index;
      const isCollapsed = collapsedNodes.has(nodeId);

      return (
        <li
          key={nodeId}
          aria-selected={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            if (selectable) {
              handleSelect(node);
            } else if (node.hasChildren) {
              toggleCollapse(nodeId);
            }
          }}
          onMouseEnter={() => {
            if (selectable) setHighlightedIndex(index);
          }}
          className={`py-2.5 text-sm flex items-center justify-between focus:outline-none
            ${selectable ? "cursor-pointer hover:bg-baseline-10" : "cursor-default"}
            ${isHighlighted && selectable ? "bg-baseline-10" : ""}
            ${isSelected ? "bg-baseline-10" : ""}`}
          style={{ paddingLeft: `${16 + node.depth * 20}px`, paddingRight: "16px" }}>
          <span className="flex items-center gap-1.5 truncate mr-2">
            {node.hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(nodeId);
                }}
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-baseline-60 hover:text-baseline-90">
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                  fill="currentColor"
                />
              </button>
            )}
            {!node.hasChildren && <span className="w-4 flex-shrink-0" />}
            <span
              className={`truncate ${
                selectable
                  ? isSelected
                    ? "text-dynamic-dark font-medium"
                    : "text-baseline-90"
                  : "font-semibold text-baseline-60"
              }`}>
              {identifier}
            </span>
          </span>
          {isSelected && (
            <CheckIcon className="fade-in-left flex-shrink-0" height={16} width={16} />
          )}
        </li>
      );
    });
  }, [visibleNodes, highlightedIndex, selectedValue, collapsedNodes, handleSelect, toggleCollapse, loading]);

  return (
    <>
      <div
        ref={wrapperRef}
        className={`relative w-full font-['Inter'] ${isReadOnly ? "pointer-events-none" : ""}`}
        onBlur={handleBlur}
        aria-label={field.name}
        aria-readonly={isReadOnly}
        aria-required={field.isMandatory}
        aria-disabled={isReadOnly}
        aria-details={field.helpComment}
        tabIndex={-1}>
        <input {...register(fieldName)} type="hidden" readOnly={isReadOnly} />
        <div
          ref={triggerRef}
          onClick={handleClick}
          onKeyDown={(e) => handleKeyboardActivation(e, () => handleClick(e as unknown as React.MouseEvent))}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          tabIndex={isReadOnly ? -1 : 0}
          className={mainDivClassNames}>
          <span className={labelClassNames}>
            {selectedLabel || (!isReadOnly ? t("form.select.placeholder") : "")}
          </span>
          <div className="flex items-center flex-shrink-0 ml-2">
            {shouldShowClearButton && (
              <button
                type="button"
                onClick={handleClear}
                onKeyDown={(e) => handleKeyboardActivation(e, () => handleClear(e as unknown as React.MouseEvent))}
                className={`mr-1 hover:text-gray-600 transition-opacity opacity-100 focus:outline-none focus:ring-2 focus:ring-dynamic-light rounded ${
                  isFocused || isOpen ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)"
                }`}
                aria-label="Clear selection">
                <XIcon />
              </button>
            )}
            {!isReadOnly && (
              <ChevronDown fill="currentColor" className={chevronClassNames} />
            )}
          </div>
        </div>
      </div>
      {!isReadOnly && (
        <DropdownPortal
          isOpen={isOpen}
          viewportData={dropdownViewportData}
          searchTerm={searchTerm}
          searchInputRef={searchInputRef as React.RefObject<HTMLInputElement>}
          handleSetSearchTerm={handleSetSearchTerm}
          handleKeyDown={handleKeyDown}
          handleSearchBlur={handleSearchBlur}
          handleFocus={handleFocus}
          listRef={listRef as React.RefObject<HTMLUListElement>}
          handleScroll={handleScroll}
          renderedOptions={<>{renderedOptions}</>}
          dropdownId={dropdownId}
        />
      )}
    </>
  );
}

export const TreeSelector = memo(TreeSelectorCmp);
export default TreeSelector;
```

- [ ] **Step 2: Verify lint passes**

Run: `pnpm lint -- packages/MainUI/components/Form/FormView/selectors/TreeSelector.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/TreeSelector.tsx
git commit -m "Feature ETP-3754: Add TreeSelector component with hierarchical dropdown"
```

---

### Task 5: Wire Up GenericSelector Switch Cases

**Files:**
- Modify: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx`

- [ ] **Step 1: Add the import for TreeSelector**

At the top of `GenericSelector.tsx`, add after the existing selector imports (around line 51):

```typescript
import { TreeSelector } from "./TreeSelector";
```

- [ ] **Step 2: Add the ASSIGNMENT case (grouped with TableDir cases)**

In the switch statement, add AFTER the existing `TABLE_DIR_18` case (line 112) and BEFORE the closing `return` of the TableDirSelector block (line 114). This groups it logically with the other TableDir references:

```typescript
      case FIELD_REFERENCE_CODES.TABLE_DIR_18.id:
      // Assignment (ref 33): uses TableDirDomainType in Classic — resource assignment FK
      case FIELD_REFERENCE_CODES.ASSIGNMENT.id:
        return (
          <TableDirSelector field={effectiveField} isReadOnly={isReadOnly} data-testid="TableDirSelector__6e80fa" />
        );
```

- [ ] **Step 3: Add the TREE_REFERENCE case**

In the switch statement, add BEFORE the `default` case (around line 216):

```typescript
      // Tree Reference: hierarchical FK selector (e.g. Characteristic Values)
      case FIELD_REFERENCE_CODES.TREE_REFERENCE.id:
        return (
          <TreeSelector field={effectiveField} isReadOnly={isReadOnly} />
        );
```

- [ ] **Step 4: Verify lint and build pass**

Run: `pnpm lint -- packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx && pnpm build`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx
git commit -m "Feature ETP-3754: Wire Assignment and Tree Reference in GenericSelector"
```

---

### Task 6: Manual Verification

- [ ] **Step 1: Start dev server and verify Assignment field renders as TableDir dropdown**

Run: `pnpm dev`
Navigate to a window with an Assignment field (Resource Booking or Manufacturing Order with S_ResourceAssignment_ID). Confirm it renders as a standard TableDir dropdown instead of a plain text field.

- [ ] **Step 2: Verify Tree Reference field renders with hierarchy**

Navigate to the Product window → Product Characteristics tab (or use filters). Confirm the Characteristic Value field renders a tree dropdown with:
- Root nodes (characteristics) shown in bold, non-selectable
- Child nodes (values) indented under their parent, selectable
- Search filters and preserves ancestor context
- Expand/collapse chevrons work on parent nodes

- [ ] **Step 3: Verify no regressions in existing selectors**

Open a window with TableDir fields (e.g. Sales Order), Select fields, List fields. Confirm they all still render and function correctly.

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: All tests pass, including the new treeUtils tests.
