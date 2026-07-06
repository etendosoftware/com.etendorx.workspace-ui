# Missing Reference Types & Existing Type Fixes — Design Spec

## Overview

Complete the field/column reference type coverage in the new Etendo UI by fixing gaps in existing types and implementing the remaining reference types that are actively used in Etendo Core.

**Backend changes**: None. All metadata (reference IDs, column properties, selector info) is already sent by the metadata module.

**Branch**: `epic/ETP-3931`

**Approach**: Extend existing components where possible (Approach B). No new component for Memo — reuse TextLongSelector. New components only when behavior genuinely differs.

**Commit strategy**: One commit per fix/feature, grouped by phase.

---

## Phase 1: Fixes to Existing Types

### 1.1 Integer/Decimal min/max Validation

**Problem**: `NumericSelector` does not validate `minValue`/`maxValue` from column metadata. Only `QuantitySelector` does (receives `min`/`max` as props from GenericSelector:130-131). Integer and Decimal fields with range constraints are accepted without client-side validation.

**Solution**: Read `field.column.minValue` and `field.column.maxValue` inside `UnifiedNumericSelector`. Use `validateNumber` from `@workspaceui/componentlibrary/src/utils/quantitySelectorUtil` (already used by QuantitySelector) for the validity check, then write new inline clamping logic in `handleBlur`. Show visual feedback when the value is out of range.

**Important**: `validateNumber` accepts a **string** as its first argument and returns `{ isValid, errorMessage }` — it does **not** clamp. The clamping logic (`Math.max(min, Math.min(max, value))`) must be written separately in `handleBlur`. Pass `String(parsedValue)` to `validateNumber` since `handleBlur` already has the parsed number.

**Changes**:

| File | Change |
|------|--------|
| `packages/MainUI/components/Form/FormView/selectors/NumericSelector.tsx` | Import `validateNumber` from `@workspaceui/componentlibrary/src/utils/quantitySelectorUtil`. In `handleBlur`, after parsing the value: (1) read `field.column.minValue`/`maxValue`, (2) call `validateNumber(String(parsedValue), minValue, maxValue, true)` to check validity, (3) if invalid, clamp with `Math.max(min, Math.min(max, parsedValue))` and set the clamped value. Add red border feedback via a local `hasError` state. |

**Behavior**:
- On blur: if value < minValue, clamp to minValue. If value > maxValue, clamp to maxValue.
- Show brief visual error indicator (red bottom border) before clamping.
- `allowNegative` defaults to `true` for Integer/Decimal (unlike Quantity which defaults to `false`).

**Validation**: Test with Sales Order > Lines > `Line No.` field (Integer with typical min=0).

---

### 1.2 Upload File — Form Save Pipeline

**Problem**: The NOTE in GenericSelector (line 187-190) states that the form save pipeline does not support multipart uploads. `UploadFileSelector` stores a fake path string. Actual file persistence is not connected.

**Solution**: Follow the `ImageSelector` + `useImageUpload` pattern. Create a `useFileUpload` hook that uploads the file via a dedicated endpoint before the form save, then stores the resulting attachment ID in the form value.

**Endpoint discovery required**: The exact upload endpoint, request format, and response format must be determined before implementation. The existing `useImageUpload` uses `POST /api/erp/utility/ImageInfoBLOB` with params like `Command: "SAVE_OB3"`, `inpColumnName`, `inpTabId` and parses an HTML callback response. The file upload endpoint is likely different (possibly `/ws/com.etendoerp.attachment` or similar). **Pre-implementation step**: inspect Classic network traffic when uploading a file in a window with Upload File reference type to determine the exact endpoint, required form fields, and response format.

**Changes**:

| File | Change |
|------|--------|
| `packages/MainUI/hooks/useFileUpload.ts` | **New** — Hook accepting a `File` object. Uploads via `FormData` POST to the discovered endpoint. Returns `{ upload, isUploading, error, attachmentId }`. |
| `packages/MainUI/components/ProcessModal/selectors/UploadFileSelector.tsx` | Integrate `useFileUpload`. On file selection, trigger upload immediately. Show progress indicator during upload. In read-only mode, show download link. Add clear/remove button. |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Remove the NOTE comment (lines 187-190) once the pipeline is connected. |

**Hook API**:

```typescript
interface UseFileUploadResult {
  upload: (file: File) => Promise<string>; // returns attachment ID
  isUploading: boolean;
  progress: number; // 0-100
  error: string | null;
  reset: () => void;
}

function useFileUpload(): UseFileUploadResult;
```

**Behavior**:
1. User selects file → `upload(file)` fires immediately
2. Progress indicator shown during upload
3. On success, attachment ID stored in form value via `setValue`
4. On error, show error message, allow retry
5. Read-only: show filename as download link (fetched from attachment metadata)
6. Clear button: remove attachment reference, set form value to null

**Validation**: Find a window with Upload File reference type in Classic DB and test end-to-end.

---

### 1.3 Text/Memo Grid Truncation

**Problem**: Text and Memo fields in grid view show full content without truncation or tooltip. Long content breaks grid layout or is silently clipped by CSS without user indication.

**Solution**: Add a `renderTextCell` helper in `tableColumns.tsx` that wraps long text in a truncated container with a tooltip showing the full content on hover.

**Changes**:

| File | Change |
|------|--------|
| `packages/MainUI/utils/tableColumns.tsx` | Add `renderTextCell(value: string)` — returns a `<span>` with `truncate` class and Tooltip wrapper from ComponentLibrary. Max display: single line in grid. |
| `packages/MainUI/hooks/table/useColumns.tsx` | Apply `renderTextCell` for columns whose `column.reference` matches Text (`"14"`), Memo (`"34"`), or Rich Text (`"7CB371C13D204EB69BF370217F692999"`). Do **not** match on `FieldType.TEXT` — that is the default fallback for all unrecognized reference types and would over-apply truncation. |

**Behavior**:
- Grid cell shows single line of text with ellipsis overflow
- Hover shows full content in a tooltip (using existing Tooltip component)
- Applies only to reference types: Text (14), Memo (34), and Rich Text (rendered as stripped plain text in grid)

---

### 1.4 PAttribute Improvements

**Problem**: The PAttribute modal works for basic cases but has gaps:
1. `hasRequiredFields` does not validate mandatory lot/serial fields from config
2. No way to clear/reset a selected attribute set instance
3. Instance vs non-instance distinction not handled (deferred — depends on backend behavior)

**Solution**:

**1.4a — Mandatory lot/serial validation**:

The current `AttributeSetConfig` type only has `isLot` and `isSerNo` (booleans for feature enabled), but does **not** have `isMandatoryLot` or `isMandatorySerNo`. The backend response from `AttributeSetInstanceActionHandler` needs to be checked for these fields.

**Pre-implementation step**: Inspect the backend response from the CONFIG action for an attribute set that has mandatory lot enabled. Check if `isMandatoryLot`/`isMandatorySerNo` are present in the response JSON.

| File | Change |
|------|--------|
| `packages/MainUI/components/Form/FormView/selectors/AttributeSetInstance/types.ts` | If backend sends mandatory flags: add `isMandatoryLot: boolean` and `isMandatorySerNo: boolean` to `AttributeSetConfig` |
| `packages/MainUI/hooks/useAttributeSetConfig.ts` | If backend sends mandatory flags: parse `data.isMandatoryLot` and `data.isMandatorySerNo` in the config mapping (lines 59-66) |
| `packages/MainUI/components/Form/FormView/selectors/AttributeSetInstance/AttributeSetInstanceModal.tsx` | Extend `hasRequiredFields` memo: if `config.isMandatoryLot && !formData.lot` return false. Same for `isMandatorySerNo`/`serialNo`. If backend does not send these flags, skip this sub-item (no backend changes in this spec). |

**1.4b — Clear button**:

| File | Change |
|------|--------|
| `packages/MainUI/components/Form/FormView/selectors/AttributeSetInstance/AttributeSetInstanceSelector.tsx` | Add X icon button next to the search icon (visible only when value is set and not read-only). On click: `setValue(fieldName, null)`, `setValue(\`${fieldName}$_identifier\`, null)`, clear `displayValue` and `lastSavedInstanceId`. |

**1.4c — Instance vs non-instance** (deferred):

The save endpoint (`useAttributeSetInstance.saveInstance`) already receives `attributeSetId` and `instanceId`. The backend should handle whether to create a new instance or reuse. If the backend does not distinguish, this becomes a backend task. No frontend change planned for this spec — verify during manual testing.

---

### 1.5 Password Show/Hide Toggle

**Problem**: `PasswordSelector` renders with fixed `type="password"`. No way to reveal the value for verification.

**Solution**: Add a toggle button with eye/eye-off icon inside the input field.

**Changes**:

| File | Change |
|------|--------|
| `packages/MainUI/components/Form/FormView/selectors/PasswordSelector.tsx` | Add `showPassword` state (default false). Pass `showClearButton={false}` to TextInput (clear button is not useful for password fields — the user should retype, not clear and retype). Use the `endAdornment` prop of TextInput to render the eye toggle button (absolute positioned right, same slot where clear button would be). When toggled, switch between `type="password"` and `type="text"`. Do not show toggle when value is the placeholder `"***"`. |

**Behavior**:
- Default: password masked
- Click eye icon: reveals text
- Click again: masks again
- When value is `"***"` (placeholder): toggle hidden (nothing useful to reveal)
- Clear button removed (`showClearButton={false}`) — eye toggle takes its place via `endAdornment`
- Icon: inline SVG (eye-open / eye-closed), no new dependency

---

### Phase 1 Commit Plan

| # | Commit message | Scope |
|---|---------------|-------|
| 1 | `Feature ETP-3931: Add min/max validation to NumericSelector` | 1.1 |
| 2 | `Feature ETP-3931: Integrate file upload pipeline for UploadFileSelector` | 1.2 |
| 3 | `Feature ETP-3931: Add grid truncation with tooltip for Text fields` | 1.3 |
| 4 | `Feature ETP-3931: Improve PAttribute mandatory validation and clear` | 1.4 |
| 5 | `Feature ETP-3931: Add show/hide toggle to PasswordSelector` | 1.5 |

---

## Phase 2: New Reference Types (Frequently Used)

### 2.1 Memo (ID: 34) — Route to TextLongSelector

**Problem**: 11 columns in core (DefaultValue, SQL_Record_Identifier, Observation, etc.) fall through to `StringSelector` and render as single-line inputs instead of textareas.

**Solution**: Add routing only — no new component. Memo is functionally identical to Text (14) in the new UI.

**Changes**:

| File | Change |
|------|--------|
| `packages/MainUI/utils/form/constants.ts` | Add `MEMO: { id: "34", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR }` |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add `case FIELD_REFERENCE_CODES.MEMO.id:` alongside the existing `TEXT_LONG` case, both routing to `TextLongSelector` |
| `packages/MainUI/utils/index.ts` | Add `case "34":` in `getFieldReference()` returning `FieldType.TEXT` |

**Validation**: Open a window with a Memo field (e.g., Tables and Columns > Table > Observation field) and confirm it renders as a textarea.

---

### 2.2 Link (ID: 800101) — New LinkSelector

**Problem**: 3 columns (URL in BankAccount, YourCompanyURL, etc.) fall through to `StringSelector`. Should render as clickable hyperlink in read-only and text input in edit mode.

**Solution**: New `LinkSelector` component with dual rendering.

**Changes**:

| File | Change |
|------|--------|
| `packages/MainUI/utils/form/constants.ts` | Add `LINK: { id: "800101", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR }` |
| `packages/MainUI/components/Form/FormView/selectors/LinkSelector.tsx` | **New** — See component spec below |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add `case FIELD_REFERENCE_CODES.LINK.id:` → `LinkSelector` |
| `packages/MainUI/utils/index.ts` | Add `case "800101":` in `getFieldReference()` returning `FieldType.TEXT` |

**Component spec**:

```typescript
interface LinkSelectorProps {
  field: Field;
  isReadOnly: boolean;
}
```

**Behavior**:
- **Edit mode**: Standard `TextInput` (reuse existing component). Same as StringSelector but with URL-specific placeholder ("https://...").
- **Read-only mode**: Render as `<a href={value} target="_blank" rel="noopener noreferrer">` with link styling (blue, underline). Truncated with `max-w` and ellipsis if URL is long.
- **Empty value**: Show nothing in read-only (not a broken link). Show empty input in edit.
- **No strict URL validation on input**: Users can type freely. Only the display mode changes.

**Validation**: Open Business Partner > Customer/Vendor tab > URL field.

---

### 2.3 Product Characteristics (ID: C632F1CFF5A1453EB28BDF44A70478F8) — Read-Only Routing

**Problem**: 3 columns (`Characteristic_Desc`) fall through to StringSelector. This field is always read-only — it displays a concatenated description of product characteristics composed from the Product Characteristics window.

**Solution**: Route to `StringSelector` with forced `isReadOnly={true}`. No new component.

**Changes**:

| File | Change |
|------|--------|
| `packages/MainUI/utils/form/constants.ts` | Add `PRODUCT_CHARACTERISTICS: { id: "C632F1CFF5A1453EB28BDF44A70478F8", calloutTrigger: CALLOUT_TRIGGERS.ON_BLUR }` |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add case: `return <StringSelector field={effectiveField} readOnly={true} />`. Add a comment on the case explaining that Product Characteristics are always read-only (composed from Product Characteristics window, not editable inline). This hardcoded override intentionally ignores the `isReadOnly` prop from GenericSelector. |
| `packages/MainUI/utils/index.ts` | Add case in `getFieldReference()` returning `FieldType.TEXT` |

**Validation**: Find a Product with characteristics and verify the field shows the concatenated description as read-only text.

---

### Phase 2 Commit Plan

| # | Commit message | Scope |
|---|---------------|-------|
| 6 | `Feature ETP-3931: Route Memo reference type to TextLongSelector` | 2.1 |
| 7 | `Feature ETP-3931: Add LinkSelector for URL reference fields` | 2.2 |
| 8 | `Feature ETP-3931: Route Product Characteristics as read-only string` | 2.3 |

---

## Phase 3: Isolated Types (Manual Testing Required Before Implementation)

**Important**: Both types in this phase are blocked until manual verification of metadata responses. Implementation starts only after confirming the prerequisites listed below.

### 3.1 Assignment (ID: 33) — Route to TableDirSelector or New AssignmentSelector

**Problem**: 3 columns (`S_ResourceAssignment_ID`) fall through to StringSelector. In Classic, this opens a popup to select a resource assignment (resource, date, quantity).

**Hypothesis**: Since Assignment is a FK to `S_ResourceAssignment`, routing to `TableDirSelector` may work if the metadata module exposes the entity correctly.

**Prerequisites to verify manually**:
1. Open a window with an Assignment field in the new UI
2. Check browser devtools: does the metadata response include `referencedEntity: "ResourceAssignment"` for this field?
3. Does the selector search modal load and show results for this entity?

**Option A — TableDirSelector works**:

| File | Change |
|------|--------|
| `packages/MainUI/utils/form/constants.ts` | Add `ASSIGNMENT: { id: "33", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE }` |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add case → `TableDirSelector` |
| `packages/MainUI/utils/index.ts` | Add case returning `FieldType.TABLEDIR` |

**Option B — Needs custom component** (if metadata doesn't resolve the entity):

| File | Change |
|------|--------|
| `packages/MainUI/components/Form/FormView/selectors/AssignmentSelector.tsx` | **New** — Wrapper around TableDirSelector with hardcoded entity configuration for `ResourceAssignment` |
| Other files | Same as Option A |

**Validation**: Test in a window containing `S_ResourceAssignment_ID` (e.g., resource-related windows).

---

### 3.2 Tree Reference (ID: 8C57A4A2E05F4261A1FADF47C30398AD) — New TreeSelector

**Problem**: 1 column (`M_Ch_Value_ID` — Characteristic Value) uses Tree Reference. In Classic, this renders as a selector with hierarchical tree navigation (parent-child nodes).

**Prerequisites to verify manually**:
1. Check the tree datasource response: call the tree datasource endpoint (ID `90034CAE96E847D78FBEF6D38CB1930D` defined in metadata constants) and examine the response structure
2. Confirm: what fields come per node? (expected: `id`, `name`/`_identifier`, `parentId`)
3. Confirm: can any level be selected, or only leaf nodes?
4. Confirm: how many nodes typically exist? (determines if client-side tree building is viable)

**Solution**: New `TreeSelector` component with modal containing an expandable tree.

**Changes**:

| File | Change |
|------|--------|
| `packages/MainUI/utils/form/constants.ts` | Add `TREE_REFERENCE: { id: "8C57A4A2E05F4261A1FADF47C30398AD", calloutTrigger: CALLOUT_TRIGGERS.ON_CHANGE }` |
| `packages/MainUI/components/Form/FormView/selectors/TreeSelector/TreeSelector.tsx` | **New** — Field display + button to open modal |
| `packages/MainUI/components/Form/FormView/selectors/TreeSelector/TreeModal.tsx` | **New** — Modal with expandable/collapsible tree |
| `packages/MainUI/components/Form/FormView/selectors/TreeSelector/index.ts` | **New** — barrel export |
| `packages/MainUI/hooks/useTreeData.ts` | **New** — Fetches tree datasource, builds hierarchical structure from flat list using `parentId` |
| `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx` | Add case → `TreeSelector` |
| `packages/MainUI/utils/index.ts` | Add case returning `FieldType.SELECT` |

**TreeSelector behavior**:
- **Read-only**: Plain text label showing selected node's identifier
- **Edit mode**: Text display + search icon button (same visual pattern as AttributeSetInstanceSelector)
- Click opens `TreeModal`

**TreeModal behavior**:
- Loads all nodes on open via `useTreeData`
- Builds tree structure client-side (flat list → nested, using `parentId`)
- Each node: indented by level, chevron icon for expand/collapse, click to select
- Selected node highlighted with blue background
- OK/Cancel buttons at bottom
- Optional: search/filter input at top to filter nodes by name

**useTreeData hook**:

```typescript
interface TreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children: TreeNode[];
}

interface UseTreeDataResult {
  tree: TreeNode[];        // root nodes with nested children
  loading: boolean;
  error: string | null;
}

function useTreeData(datasourceId: string | null): UseTreeDataResult;
```

**Styling**: Pure Tailwind, no tree library dependency. The dataset is small (Characteristic Values are typically < 100 nodes).

**Validation**: Open a window with `M_Ch_Value_ID` field and test tree navigation.

---

### Phase 3 Commit Plan

| # | Commit message | Scope |
|---|---------------|-------|
| 9 | `Feature ETP-3931: Add Assignment reference type support` | 3.1 |
| 10 | `Feature ETP-3931: Add TreeSelector for tree reference fields` | 3.2 |

---

## Summary

| Phase | Items | New Files | New Dependencies |
|-------|-------|-----------|-----------------|
| 1 — Fixes | 5 fixes to existing types | 1 (useFileUpload hook) | 0 |
| 2 — Frequent types | 3 new reference types | 1 (LinkSelector) | 0 |
| 3 — Isolated types | 2 new reference types | 3-5 (TreeSelector + hook, possibly AssignmentSelector) | 0 |

**Total new dependencies**: 0

**Reference types NOT implemented (confirmed unused in core columns)**:
- Color (ID: 27) — 0 columns
- Window Reference (FF808181...) — 0 columns (UI framework config only)
- DateTime_From / DateTime_To — 0 columns
- Search Vector — 0 columns
- Non-Transactional Sequence — 0 columns
- Masked String — does not exist as reference type
- OBKMO_Widget in Form — does not exist as reference type

**Previously confirmed as already working**:
- `isUpdateable='N'` — handled in BaseSelector.tsx:266 and Table/index.tsx:473-499
- Hardcoded buttons (DocAction, Posted, CreateFrom, etc.) — fully resolved via metadata-driven process definitions
- Color (ID: 27) — no columns use it; ColorCell is for FK color display only
