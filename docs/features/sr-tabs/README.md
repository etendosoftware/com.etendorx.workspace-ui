# SR (Single Record) Tabs

## Overview

An SR (Single Record) tab is a child tab whose `uIPattern === "SR"` and
`defaultEditMode === true`. SR tabs are expected to show **exactly one record
for each parent selection** and, by business rule, the UI must open the form
view directly (skipping the grid) as soon as the parent record is selected.

## Variants

Although all SR tabs share the same UX contract, the underlying relation with
the parent entity can take several structurally different shapes. The
disambiguation matters because the auto-open strategy is different for each.

### 1:1 ID extension

The child table extends the parent by **sharing the primary key**: the same
column is both the child's PK and the FK to the parent (e.g.
`AD_ClientInfo.ad_client_id`). Consequently `child.id === parent.id`.

- **Example**: Window *Client* → child tab *Information* (entity
  `ClientInformation` / table `AD_ClientInfo`).
- **Tab metadata**: `parentColumns === ["client"]` and the field marked as PK
  in `tab.fields` has key `"client"` → PK ∈ `parentColumns`.
- **Auto-open**: handled eagerly by [`Tab.tsx`](../../../packages/MainUI/components/window/Tab.tsx)
  (`useEffect` that calls `handleSetRecordId(parentSelectedRecordId)` as soon as
  the parent selection changes).

### Logical relation

The child has its own PK and relates to the parent through an independent FK
column. `child.id !== parent.id`.

- **Example**: Window *Organization* → child tab *Certificado Digital* (entity
  `ETSG_Certificate`).
- **Tab metadata**: `parentColumns === ["organization"]` and the field marked
  as PK is a different column (the child's own id) → PK ∉ `parentColumns`.
- **Auto-open**: handled by [`DynamicTable`](../../../packages/MainUI/components/Table/index.tsx)
  after the child records are fetched, by picking `displayRecords[0].id` and
  calling the `setRecordId` prop (which is wired to `handleSetRecordId` in
  Tab.tsx and triggers the FORM/EDIT transition).

### No link column (filtered by the where clause)

The child table has no column pointing at the parent, so the backend answers
`parentProperty === ""` (classic `ApplicationUtils.getParentProperty`). The tab
is filtered by its `hqlwhereclause`, which reads the parent session values.

- **Example**: Window *Sales Invoice* → child tab *Accounting* (table
  `Fact_Acct`, where clause `e.table.id = '318' and e.recordID = @Invoice.id@`).
  The 17 Accounting tabs of the posted documents follow this shape.
- **Tab metadata**: `parentColumns === []`, `parentProperty === ""`.
- **Criteria**: `_dummy`, as classic `OBViewGrid` sends for subtabs without a
  parent property; the server filters through the where clause.
- **Auto-open**: same as the logical relation (`DynamicTable`, first fetched record).

### Same table as the parent

The child tab shows the parent record itself, through another set of fields.

- **Example**: Window *Business Partner* → child tabs *Customer*,
  *Vendor/Creditor* and *Employee* (table `C_BPartner`).
- **Rule**: classic `OBViewTab.getParentProperty` filters a RO/SR child tab on
  its parent's table by `id`, so it is a 1:1 ID extension.

## Discriminating the variants

The variant is decided by the helper
[`isSrOneToOneExtension`](../../../packages/MainUI/utils/window/utils.ts):

```ts
isSrOneToOneExtension(tab, parentTab)
// true  → 1:1 ID extension (Tab.tsx path, criteria by `id`)
// false → logical relation or no link column (DynamicTable path, FK or `_dummy` criteria)
```

The algorithm mirrors classic `OBViewTab.getParentProperty`:

1. If the tab is on the same table as `parentTab` (`tab.table`), it is 1:1.
2. If `tab.parentColumns` is empty: when the backend sent `parentProperty`
   (always `""` in that case) the tab has no link column and is **not** 1:1;
   without that key (older metadata, root SR tabs) it is treated as 1:1
   (legacy behavior: no FK is modelled and `child.id === parent.id` by convention).
3. Otherwise, locate the child's primary-key field via the project-wide
   convention `field.column.keyColumn` truthy (same pattern used by
   [`useFormInitialization`](../../../packages/MainUI/hooks/useFormInitialization.ts)
   and
   [`useTableSelection/sessionSync.ts`](../../../packages/MainUI/utils/hooks/useTableSelection/sessionSync.ts)).
   If the PK field key is listed in `parentColumns`, the tab is 1:1; otherwise
   it is logical.

`parentColumns.length` alone is **not** a valid discriminator: both variants
frequently declare exactly one entry.

## Data flow

```mermaid
flowchart TD
    A[Parent record selected] --> B{isSrOneToOneExtension}
    B -- true --> C[Tab.tsx useEffect]
    C --> D[handleSetRecordId - parent.id]
    D --> E[FormView with child = parent id]

    B -- false --> F[DynamicTable renders grid, hidden]
    F --> G[useTableData fetches child records<br/>via resolveParentFieldName + buildBaseCriteria]
    G --> H{displayRecords.length > 0?}
    H -- no --> I[Stay in empty grid, no auto-open]
    H -- yes --> J[DynamicTable useEffect]
    J --> K[setRecordId - displayRecords 0 .id]
    K --> L[FormView with real child id]
```

## History

- ETP-3740 introduced `isSrOneToOneExtension`, treating every SR tab without
  link columns as 1:1.
- ETP-3754 restricted the `id` criteria to true 1:1 tabs (Payment Plan).
- ETP-4613 added the backend `parentProperty` and the `_dummy` fallback for
  tabs without a link column, but the SR check ran first and still sent
  `id = <parent id>` for the Accounting tabs, which then showed no records.
- ETP-4641 applies the classic rule above, so those tabs reach the `_dummy`
  path while the Business Partner tabs keep the `id` criteria.

## Manual-close re-entry

Both paths track the last parent id for which auto-open fired via a ref
(`srAutoOpenedForParentRef`) so that closing the form view with the Back
button does not immediately re-open it for the same parent. Selecting a
different parent (or a parent that previously had no child and now does)
produces a fresh auto-open.

## Referenced files

- [`packages/MainUI/utils/window/utils.ts`](../../../packages/MainUI/utils/window/utils.ts) —
  `getKeyFieldName`, `isSrOneToOneExtension` helpers.
- [`packages/MainUI/components/window/Tab.tsx`](../../../packages/MainUI/components/window/Tab.tsx) —
  1:1 auto-open `useEffect` gated by `isSrOneToOneExtension`.
- [`packages/MainUI/components/Table/index.tsx`](../../../packages/MainUI/components/Table/index.tsx) —
  logical-SR auto-open `useEffect`.
- [`packages/MainUI/hooks/table/useTableData.tsx`](../../../packages/MainUI/hooks/table/useTableData.tsx) —
  child record query (already handles both variants).
- [`packages/MainUI/utils/criteriaUtils.ts`](../../../packages/MainUI/utils/criteriaUtils.ts) —
  `resolveParentFieldName`, `buildBaseCriteria`.
