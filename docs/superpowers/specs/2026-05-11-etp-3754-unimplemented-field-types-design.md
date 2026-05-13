# ETP-3754: Unimplemented Field Types — Design Spec

## Overview

Implement frontend routing and components for field reference types that currently fall through to `StringSelector` in the GenericSelector switch: Absolute DateTime, Button (28), Upload File in forms, and Rich Text. Verify SelectorAsLink navigation. Document remaining unimplemented types.

**Backend changes**: None. All metadata (reference IDs, selector info, referenced window/tab info, button ref lists) is already sent by the metadata module.

**Branch**: `epic/ETP-3595`
**Commit strategy**: One commit per selector, ordered by effort (trivial to complex).

---

## Section 1: Absolute DateTime Routing

### Problem

Fields with reference `478169542A1747BD942DD70C8B45089C` (Absolute DateTime) have no case in the `GenericSelector` switch and fall through to `StringSelector`, rendering as plain text inputs instead of date-time pickers.

Additionally, `getFieldReference()` in `packages/MainUI/utils/index.ts` has no mapping for this reference ID, so table/grid views also treat it as `FieldType.TEXT`.

### Solution

Two changes:
1. Add a case in `GenericSelector.tsx` that routes `FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME.id` to the existing `DatetimeSelector` component.
2. Add a case in `getFieldReference()` that maps this ID to `FieldType.DATETIME`.

The difference between DateTime and Absolute DateTime is timezone handling, which is already addressed at the data layer (`dateUtils.ts:43` and `useProcessPayload.ts:43` already recognize this reference ID).

### Changes

| File | Change |
|------|--------|
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add `case FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME.id:` before the existing `DATETIME` case |
| `packages/MainUI/utils/index.ts` | Add `case FIELD_REFERENCE_CODES.ABSOLUTE_DATETIME.id:` returning `FieldType.DATETIME` in `getFieldReference()` |

### Validation Cases (Classic)

Run against Etendo Classic DB to find real test screens:

```sql
SELECT w.name AS window, t.name AS tab, f.name AS field, c.columnname
FROM ad_field f
JOIN ad_tab t ON f.ad_tab_id = t.ad_tab_id
JOIN ad_window w ON t.ad_window_id = w.ad_window_id
JOIN ad_column c ON f.ad_column_id = c.ad_column_id
WHERE c.ad_reference_id = '478169542A1747BD942DD70C8B45089C'
  AND f.isactive = 'Y' AND t.isactive = 'Y' AND w.isactive = 'Y'
ORDER BY w.name, t.seqno;
```

| Window | Tab | Field | Status |
|--------|-----|-------|--------|
| _(fill from query)_ | | | Pending |

### New files: 0 | New deps: 0

### Commit message

`Feature ETP-3754: Route Absolute DateTime to DatetimeSelector`

---

## Section 2: SelectorAsLink Verification

### Problem

The issue lists SelectorAsLink (1 column) as unimplemented. However, `Label.tsx` already renders FK field labels as clickable links when `isReferencedWindowAccessible` is true, using `useRedirect` for navigation.

### Solution

Verify that the existing navigation behavior in `Label.tsx` covers SelectorAsLink fields. The key checks:

1. **`getFieldReference()` mapping**: The function at `packages/MainUI/utils/index.ts:35` maps reference IDs to `FieldType` values. If SelectorAsLink has a reference ID not in this switch, it returns `FieldType.TEXT`, and `isEntityReference()` returns `false`, preventing the label from rendering as a link.

2. **`isEntityReference()` coverage**: At `packages/api-client/src/utils/metadata.ts:80`, this only checks `FieldType.SELECT` and `FieldType.TABLEDIR`.

The SelectorAsLink reference ID must be determined from Classic DB first. Once known, we can verify whether the existing `getFieldReference` + `isEntityReference` chain covers it.

### Pre-implementation step (required)

Run this query to get the SelectorAsLink reference ID:

```sql
SELECT r.ad_reference_id, r.name, r.description
FROM ad_reference r
WHERE LOWER(r.name) LIKE '%selector%link%'
  AND r.isactive = 'Y';
```

Then check the `getFieldReference` switch for that ID. If it maps to `FieldType.SELECT` or `FieldType.TABLEDIR`, the existing code works. If not, add the mapping.

### Changes

| File | Change |
|------|--------|
| `packages/MainUI/utils/index.ts` | If needed: add SelectorAsLink reference ID to `getFieldReference()` mapping to `FieldType.SELECT` or `FieldType.TABLEDIR` |
| `packages/api-client/src/utils/metadata.ts` | If needed: extend `isEntityReference()` to cover the SelectorAsLink FieldType |
| Test files | Add test case confirming navigation for SelectorAsLink fields |

If everything already works as-is, this commit is verification/test-only.

### Validation Cases (Classic)

```sql
SELECT w.name AS window, t.name AS tab, f.name AS field, c.columnname,
       r.name AS reference_name, c.ad_reference_id
FROM ad_field f
JOIN ad_tab t ON f.ad_tab_id = t.ad_tab_id
JOIN ad_window w ON t.ad_window_id = w.ad_window_id
JOIN ad_column c ON f.ad_column_id = c.ad_column_id
JOIN ad_reference r ON c.ad_reference_id = r.ad_reference_id
WHERE LOWER(r.name) LIKE '%selector%link%'
  AND f.isactive = 'Y'
ORDER BY w.name, t.seqno;
```

| Window | Tab | Field | Status |
|--------|-----|-------|--------|
| _(fill from query)_ | | | Pending |

### New files: 0 | New deps: 0

### Commit message

`Feature ETP-3754: Verify SelectorAsLink navigation behavior`

---

## Section 3: Upload File in Forms

### Problem

`UploadFileSelector` exists at `packages/MainUI/components/ProcessModal/selectors/UploadFileSelector.tsx` but is only wired for process parameters. Fields with reference `715C53D4FEA74B28B74F14AE65BC5C16` in forms fall through to `StringSelector`.

### Solution

Wire the existing `UploadFileSelector` into the Form `GenericSelector` switch. The component already accepts a `Field` prop and uses `react-hook-form`. The `onFileChange` prop is optional in the interface, so it can be omitted for form usage.

### File save pipeline gap

The form save pipeline (`FormView/index.tsx`) submits record data as JSON via `datasource.save()`. There is **no multipart form data mechanism** for form-level record saves. The `UploadFileSelector` in process parameters works because `useProcessPayload` handles `fileParams` separately via `FormData`.

For form fields, the current `UploadFileSelector` will allow the user to **select** a file and store a fake path string (`C:\\fakepath\\filename`) in the form value. Whether this is sufficient depends on how the backend expects file uploads for non-process form fields.

**Two possible outcomes during implementation**:
- (a) The backend accepts the file path string and handles upload separately (e.g., via attachment API) — in this case, the current component works as-is.
- (b) The backend needs multipart upload — in this case, we'd need to extend the form save pipeline or use a pre-save upload step (similar to how `ImageSelector` uploads via `useImageUpload` before save, then stores the resulting ID).

**Action**: During implementation, check how Classic handles Upload File in form context. If it requires a pre-save upload (like Image), create a `useFileUpload` hook following the `useImageUpload` pattern.

### Changes

| File | Change |
|------|--------|
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add `case FIELD_REFERENCE_CODES.UPLOAD_FILE.id:` routing to `UploadFileSelector` |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add import for `UploadFileSelector` |
| _(conditional)_ `packages/MainUI/hooks/useFileUpload.ts` | If pre-save upload is needed: new hook following `useImageUpload` pattern |

### Validation Cases (Classic)

```sql
SELECT w.name AS window, t.name AS tab, f.name AS field, c.columnname
FROM ad_field f
JOIN ad_tab t ON f.ad_tab_id = t.ad_tab_id
JOIN ad_window w ON t.ad_window_id = w.ad_window_id
JOIN ad_column c ON f.ad_column_id = c.ad_column_id
WHERE c.ad_reference_id = '715C53D4FEA74B28B74F14AE65BC5C16'
  AND f.isactive = 'Y' AND t.isactive = 'Y' AND w.isactive = 'Y'
ORDER BY w.name, t.seqno;
```

| Window | Tab | Field | Status |
|--------|-----|-------|--------|
| _(fill from query)_ | | | Pending |

### New files: 0-1 | New deps: 0

### Commit message

`Feature ETP-3754: Wire UploadFileSelector for form fields`

---

## Section 4: Button (28) in Forms

### Problem

Fields with reference `28` (Button) fall through to `StringSelector` and render as text inputs. In Etendo Classic, button fields in forms render as clickable buttons that trigger a process. Note: `getFieldReference()` already maps `"28"` to `FieldType.BUTTON` (line 62-63 of `utils/index.ts`), so grid/table views already recognize the type — only the form GenericSelector switch is missing the case.

### Solution

Create a new `ButtonSelector` component using Tailwind (not MUI) that renders as a styled button triggering a process modal.

Extract the process-fetching logic from `GenericSelector`'s `handleProcessClick` (lines 85-133) into a shared hook `useProcessTrigger` so both `GenericSelector` (for the plus-icon process trigger on selector fields) and `ButtonSelector` can reuse it without duplication.

### Changes

| File | Change |
|------|--------|
| `packages/MainUI/hooks/useProcessDefinitionTrigger.ts` | **New** — Shared hook extracting process fetch + modal state from GenericSelector's `handleProcessClick` (named `useProcessDefinitionTrigger` to avoid confusion with existing `useProcessButton` toolbar hook) |
| `packages/MainUI/components/Form/FormView/selectors/ButtonSelector.tsx` | **New** — Tailwind button component using `useProcessTrigger` |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add `case FIELD_REFERENCE_CODES.BUTTON.id:` routing to `ButtonSelector`; refactor to use `useProcessTrigger` |

### Component API

```tsx
interface ButtonSelectorProps {
  field: Field;
  isReadOnly: boolean;
}
```

Uses `useFormContext()` internally for `getValues()` (needed for `contextRecord` in `ProcessDefinitionModal`).

### Behavior

1. **Render**: Tailwind-styled button with `field.name` as label
2. **Click** (no refList): Fetch process definition via `Metadata.client.post`, open `ProcessDefinitionModal`
3. **Click** (with refList): `field.refList` (`RefListField[]` — `{id, label, value}`) provides multiple action options. Render a dropdown/popover listing each option by `label`. Selecting an option triggers the process with that ref list value. The dropdown uses Tailwind (simple absolute-positioned div with menu items).
4. **Read-only**: Disabled button with muted styling (`opacity-50 cursor-not-allowed`)
5. **Loading**: Show inline spinner while fetching process definition

### `useProcessDefinitionTrigger` hook API

```tsx
interface UseProcessDefinitionTriggerResult {
  isProcessModalOpen: boolean;
  processButtonData: ProcessDefinitionButton | null;
  isLoading: boolean;
  triggerProcess: (processId: string) => Promise<void>;
  closeProcessModal: () => void;
}

function useProcessDefinitionTrigger(field: Field): UseProcessDefinitionTriggerResult;
```

### Validation Cases (Classic)

```sql
SELECT w.name AS window, t.name AS tab, f.name AS field, c.columnname,
       p.name AS process_name
FROM ad_field f
JOIN ad_tab t ON f.ad_tab_id = t.ad_tab_id
JOIN ad_window w ON t.ad_window_id = w.ad_window_id
JOIN ad_column c ON f.ad_column_id = c.ad_column_id
LEFT JOIN ad_process p ON c.ad_process_id = p.ad_process_id
WHERE c.ad_reference_id = '28'
  AND f.isactive = 'Y' AND t.isactive = 'Y' AND w.isactive = 'Y'
ORDER BY w.name, t.seqno
LIMIT 10;
```

Common Classic examples (likely results):
- **Sales Order** window > "Complete" / "Post" buttons
- **Invoice** window > document action buttons
- **Payment** window > process action buttons

| Window | Tab | Field | Process | Status |
|--------|-----|-------|---------|--------|
| _(fill from query)_ | | | | Pending |

### New files: 2 | New deps: 0

### Commit message

`Feature ETP-3754: Add ButtonSelector for process buttons in forms`

---

## Section 5: Rich Text (Deferred)

### Problem

No WYSIWYG editor exists. Rich Text fields (1 column) need an HTML editor for view and edit modes.

### Solution

Integrate TipTap as the editor library. Create a `RichTextSelector` component that:
- **View mode**: Renders sanitized HTML in a read-only styled container
- **Edit mode**: TipTap editor with minimal toolbar (bold, italic, underline, lists, links, headings)
- Stores/loads HTML string via `react-hook-form` `setValue`/`watch`
- Tailwind styling for toolbar and editor container

### Changes

| File | Change |
|------|--------|
| `packages/MainUI/package.json` | Add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-underline` |
| `packages/MainUI/components/Form/FormView/selectors/RichTextSelector.tsx` | **New** — TipTap-based WYSIWYG editor component |
| `packages/MainUI/utils/form/constants.ts` | Add `RICH_TEXT` constant with reference ID (TBD) |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add routing case |

### Status: DEFERRED

Blocked on:
1. User needs to review Rich Text behavior in Etendo Classic
2. Rich Text reference ID needs to be confirmed from Classic DB

### Bundle size note

TipTap core + starter-kit + 2 extensions is approximately 150-200KB gzipped. Alternatives considered:
- **Quill**: Heavier (~400KB), less customizable, aging API
- **Slate**: More flexible but much more boilerplate for basic WYSIWYG
- **TipTap** (recommended): Headless (fits Tailwind approach), actively maintained, modular (only import what you need)

### Validation Cases (Classic)

```sql
SELECT w.name AS window, t.name AS tab, f.name AS field, c.columnname,
       r.name AS reference_name, c.ad_reference_id
FROM ad_field f
JOIN ad_tab t ON f.ad_tab_id = t.ad_tab_id
JOIN ad_window w ON t.ad_window_id = w.ad_window_id
JOIN ad_column c ON f.ad_column_id = c.ad_column_id
JOIN ad_reference r ON c.ad_reference_id = r.ad_reference_id
WHERE LOWER(r.name) LIKE '%rich%text%' OR LOWER(r.name) LIKE '%html%'
  AND f.isactive = 'Y'
ORDER BY w.name, t.seqno;
```

| Window | Tab | Field | Reference ID | Status |
|--------|-----|-------|-------------|--------|
| _(fill from query — likely Email Template)_ | | | | Pending |

### New files: 1 | New deps: 4

### Commit message

`Feature ETP-3754: Add RichTextSelector with TipTap editor`

---

## Section 6: Documentation Roadmap

### Problem

The issue asks to document remaining unimplemented types: Binary, Color, Assignment, Multi-Selector, Tree Reference, Button List, Masked String.

### Solution

Create a markdown document listing each unimplemented type with reference ID, column count, expected behavior, suggested approach, and estimated effort.

### Changes

| File | Change |
|------|--------|
| `docs/features/field-types/unimplemented-types-roadmap.md` | **New** — Roadmap document |

### Validation Query

```sql
SELECT r.name AS reference_name, r.ad_reference_id,
       COUNT(DISTINCT c.ad_column_id) AS column_count
FROM ad_reference r
JOIN ad_column c ON c.ad_reference_id = r.ad_reference_id
JOIN ad_field f ON f.ad_column_id = c.ad_column_id
WHERE r.name IN ('Binary', 'Color', 'Assignment', 'Multi Selector',
                  'Tree Reference', 'Button List', 'Masked String')
  AND f.isactive = 'Y' AND c.isactive = 'Y'
GROUP BY r.name, r.ad_reference_id
ORDER BY column_count DESC;
```

### New files: 1 | New deps: 0

### Commit message

`Feature ETP-3754: Document unimplemented field type roadmap`

---

## Implementation Order

| # | Selector | Effort | Blocked |
|---|----------|--------|---------|
| 1 | Absolute DateTime | Trivial | No |
| 2 | SelectorAsLink | Verification | No — requires DB query first |
| 3 | Upload File in forms | Small | No — save pipeline TBD during impl |
| 4 | Button (28) | Small-Medium | No |
| 5 | Rich Text | Medium | Yes — Classic review pending |
| 6 | Docs roadmap | Small | No |

## Out of Scope

- Backend / metadata module changes (none needed)
- Image BLOB (already fully implemented)
- Binary, Color, Assignment, Multi-Selector, Tree Reference, Button List, Masked String (documented in roadmap only)
