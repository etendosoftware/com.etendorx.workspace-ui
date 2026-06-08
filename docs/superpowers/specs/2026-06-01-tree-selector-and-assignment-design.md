# Tree Selector & Assignment Reference — Design Spec

**Date:** 2026-06-01
**Branch:** feature/ETP-3754
**Status:** Approved

## Summary

Implement two missing field reference types from Etendo Classic:

1. **Assignment (ref 33)** — Map to existing `TableDirSelector` (it uses `TableDirDomainType` in Classic)
2. **Tree Reference (ref 8C57A4A2E05F4261A1FADF47C30398AD)** — New `TreeSelector` component with hierarchical dropdown display

## Context

These are the last unmapped reference types. Both currently fall through to the `default` case in `GenericSelector.tsx` and render as a plain `StringSelector`.

- **Assignment** is used for `S_ResourceAssignment_ID` columns in Resource Booking / Manufacturing windows. In Classic, the WAD implementation (`WADAssignment`) is essentially empty — it behaves as a standard TableDir combo box.
- **Tree Reference** is used for hierarchical FK lookups, primarily `M_Ch_Value_ID` (Characteristic Value) in the Product window. In Classic, it renders as `OBTreeItem` — a text input with a tree picker popup showing parent-child hierarchy.

## Design

### 1. Assignment (ref 33) → TableDirSelector

Simple mapping with no new components:

- Add `ASSIGNMENT: { id: "33", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE }` to `FIELD_REFERENCE_CODES`
- Add a `case` in `GenericSelector.tsx` routing to `TableDirSelector`
- Include a comment explaining this is a TableDir in Classic (`TableDirDomainType`)

### 2. Tree Reference → TreeSelector

#### Datasource Response Format

The backend returns a **flat array** with `parentId` references for hierarchy:

```json
{
  "response": {
    "data": [
      {
        "id": "2081F4D68CAF40BDBEC1FE2E27296E8A",
        "_identifier": "Cola",
        "showOpenIcon": true,
        "isCharacteristic": true
      },
      {
        "id": "42FDB301BBB2486A97392E1EDDE48159",
        "_identifier": "Uva",
        "parentId": "2081F4D68CAF40BDBEC1FE2E27296E8A",
        "characteristic": "2081F4D68CAF40BDBEC1FE2E27296E8A",
        "characteristic$_identifier": "Cola"
      },
      {
        "id": "82EACD21982F43BFB27953FA4BE2F7C8",
        "_identifier": "Manzana",
        "parentId": "2081F4D68CAF40BDBEC1FE2E27296E8A",
        "characteristic": "2081F4D68CAF40BDBEC1FE2E27296E8A",
        "characteristic$_identifier": "Cola"
      }
    ]
  }
}
```

Root detection is **generic**: a record is a root when `!record.parentId` (undefined/null/empty). The `isCharacteristic` flag is domain-specific and only controls whether a node is selectable — it is NOT used for hierarchy construction.

Child nodes: `parentId` points to parent record.

#### Data Flow

1. `useTableDirDatasource` fetches flat records (same API pattern as TableDir/Select)
2. `useSelectFieldOptions` transforms records into standard `SelectOption[]` (preserving current-value fallback, injected `$_entries`, custom `valueField`/`displayField`, and color fields)
3. `buildFlatTreeList()` utility augments the options' underlying record data with `depth` and `hasChildren`
4. `TreeSelector` renders a custom dropdown with indentation per depth level

#### Tree Hierarchy Utility

**New file:** `packages/MainUI/utils/form/treeUtils.ts`

```typescript
type TreeNode = {
  id: string;
  _identifier: string;
  parentId?: string;
  isCharacteristic?: boolean;
  depth: number;
  hasChildren: boolean;
  [key: string]: unknown;
};

function buildFlatTreeList(records: EntityData[]): TreeNode[]
```

Builds a `Map<parentId, children[]>`, then walks depth-first to produce a flat array annotated with `depth` and `hasChildren`. No nested React recursion needed — the dropdown renders a flat list with padding.

**Edge cases:**
- **Orphan records** (parentId references a non-existent node): treated as root nodes (depth 0)
- **Empty input**: returns empty array
- **Single node**: returns array with one item at depth 0
- **Circular references**: the DFS walk tracks visited nodes to prevent infinite loops
- **N-level nesting**: fully supported — the utility is generic, not capped at 2 levels

#### TreeSelector Component

**New file:** `packages/MainUI/components/Form/FormView/selectors/TreeSelector.tsx`

**Architecture decision:** TreeSelector implements its own lightweight dropdown rather than modifying the shared `Select` component. Rationale: `Select` is used across the entire app and has no extension point for custom option rendering (indentation, bold/disabled states, chevrons). Adding render props to `Select` risks regressions in all existing selectors. Tree dropdowns are simple (no infinite scroll — trees are small datasets) so the duplication cost is low.

**Props:** `{ field: Field; isReadOnly: boolean }` (same shape as TableDirSelector)

**Rendering:**
- Custom dropdown with tree-indented options
- Each option rendered with `paddingLeft: depth * 20px`
- Root/parent nodes: bold text, non-selectable when `isCharacteristic: true`
- Child/leaf nodes: normal text, indented, selectable
- Expand/collapse chevrons on parent nodes to show/hide children
- All nodes expanded by default on first open

**Expand/collapse state:**
- Component maintains a `Set<string>` of collapsed node IDs in React state
- The flat list is filtered to exclude children of collapsed nodes before rendering
- Collapse state resets when the dropdown closes

**Search behavior:**
- Typing filters matching nodes (case-insensitive substring on `_identifier`)
- Ancestor nodes of matches are preserved to maintain hierarchy context
- Example: searching "Uva" shows `Cola > Uva` with Cola as non-selectable context
- No results: shows "No options" placeholder

**Keyboard navigation:**
- Arrow keys navigate the visible (non-collapsed) list, skipping non-selectable items
- Enter selects the focused item
- Escape closes the dropdown

**Value handling:**
- Selecting a node sets `fieldName` = node id, `fieldName$_identifier` = node `_identifier`
- Same pattern as TableDirSelector value updates via `useFormContext`

#### Tests

**`packages/MainUI/utils/form/__tests__/treeUtils.test.ts`** — Unit tests for `buildFlatTreeList`:
- Empty input
- Flat input (all roots, no parents)
- Single root with children
- Multi-level nesting (3+ levels)
- Orphan nodes (parentId not in data)
- Circular parent references

## Files Changed

| File | Change |
|------|--------|
| `packages/MainUI/utils/form/constants.ts` | Add `ASSIGNMENT` and `TREE_REFERENCE` to `FIELD_REFERENCE_CODES` |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add switch cases for `ASSIGNMENT` → TableDirSelector, `TREE_REFERENCE` → TreeSelector |
| `packages/MainUI/components/Form/FormView/selectors/TreeSelector.tsx` | **New** — tree-aware selector component |
| `packages/MainUI/utils/form/treeUtils.ts` | **New** — `buildFlatTreeList()` utility |
| `packages/MainUI/utils/form/__tests__/treeUtils.test.ts` | **New** — unit tests for tree utility |

## What's NOT in Scope

- Grid cell editor for tree fields (falls back to text)
- Column filter for tree fields (falls back to text)
- Process modal tree parameter support
- Deep nesting display optimization (utility supports N levels; practical usage is 1-2 levels deep)
