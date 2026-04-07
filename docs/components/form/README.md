# Form Component

Documentation for the Form / Record Detail View used across WorkspaceUI.

## Overview

The Form component (`FormView`) renders a record in edit, view, or new-record mode. Fields are
grouped into collapsible subsections (Field Groups) defined in the ERP metadata. Permanent
subsections — **Notes**, **Attachments**, and **Linked Items** — are appended after the
metadata-driven groups and provide record-level annotations.

## Architecture

| File | Responsibility |
|------|---------------|
| `packages/MainUI/components/Form/FormView/index.tsx` | Orchestrates form state, mode transitions, and expanded-section tracking |
| `packages/MainUI/components/Form/FormView/FormFieldsContent.tsx` | Renders metadata groups and permanent sections; enforces mode-based visibility |
| `packages/MainUI/hooks/useFormFields.ts` | Transforms `Tab.fields` into sorted groups, threads `fieldGroupCollapsed` into each group shape |
| `packages/api-client/src/api/types.ts` | Defines the `Field` interface, including the `fieldGroupCollapsed` property |

### Key contexts and hooks

- `FormViewContext` — exposes `expandedSections`, `isSectionExpanded`, `handleAccordionChange`,
  and `handleSectionRef` to child components.
- `useFormFields(tab, recordId, mode)` — returns `fields` (bucketed by role) and `groups`
  (sorted `[id, GroupShape]` pairs). Group shapes carry `fieldGroupCollapsed?: boolean` sourced
  directly from the first field in each group.
- `useFormInitialization` — populates default values for new records.

## Field Group (Subsection) Behavior

### Initial collapsed/expanded state

When the form mounts or the active tab changes, `computeInitialExpandedSections` iterates over
the groups returned by `useFormFields` and builds the initial `expandedSections` array:

```ts
// FormView/index.tsx
const computeInitialExpandedSections = (groups) =>
  groups
    .filter(([id, group]) => id === null || group.fieldGroupCollapsed === false)
    .map(([id]) => String(id ?? "null"));
```

Expansion rules:

| Condition | Result |
|-----------|--------|
| `id === null` (main section) | Always expanded |
| `fieldGroupCollapsed === false` | Expanded |
| `fieldGroupCollapsed === true` | Collapsed |
| `fieldGroupCollapsed === undefined` (no metadata, e.g. synthetic sections) | Collapsed |

Permanent sections (Notes, Attachments, Linked Items) are synthetic — they carry no
`fieldGroupCollapsed` attribute — so they always start **collapsed**.

The state is seeded with an empty array on the first render and then corrected by a `useEffect`
that fires when `tab.id` changes:

```ts
useEffect(() => {
  if (lastTabIdForSectionsRef.current === tab.id) return;
  lastTabIdForSectionsRef.current = tab.id;
  setExpandedSections(computeInitialExpandedSections(groups));
}, [tab.id, computeInitialExpandedSections, groups]);
```

This means the `fieldGroupCollapsed` value from the ERP window configuration is always respected
on the first load of a tab.

### Permanent sections visibility (NEW mode)

Notes, Attachments, and Linked Items are only meaningful for saved records. They are hidden
entirely when `mode === FormMode.NEW`:

```tsx
{/* FormFieldsContent.tsx */}
{mode !== FormMode.NEW && (
  <div ref={handleSectionRef("notes_group")} ...>
    ...
  </div>
)}
```

The same guard applies to the Attachments and Linked Items sections. These sections reappear
once the record is saved and the form transitions to `FormMode.EDIT`.

## Form Modes

| Mode | Description |
|------|-------------|
| `FormMode.NEW` | Creating a new record. Permanent sections (Notes, Attachments, Linked Items) are hidden. |
| `FormMode.EDIT` | Editing a saved record. All sections visible. |
| `FormMode.VIEW` | Read-only view of a saved record. All sections visible. |

## Key Behaviors

- **Subsection collapse is metadata-driven.** The `fieldGroupCollapsed` flag on a `Field` entry
  controls whether its parent group starts expanded (`false`) or collapsed (`true` or absent).
  The flag is read from the first field encountered in the group; all fields in a group share the
  same flag. Synthetic sections (Notes, Attachments, Linked Items) have no flag and always start
  collapsed.
- **Permanent sections are mode-gated.** Notes, Attachments, and Linked Items are not rendered
  at all in `FormMode.NEW`. Do not add data-fetching logic to these sections that assumes they
  will always be present.
- **`expandedSections` resets per tab.** Switching to a different tab resets the expanded state
  to the value dictated by metadata. Manual accordion interactions within a session are not
  persisted across tab changes.
- **Audit fields are auto-detected.** If the record data contains `creationDate`, `createdBy`,
  `updated`, or `updatedBy`, an Audit group is appended automatically (sequence 9999). Audit
  fields are never shown in `FormMode.NEW`.
- **Silent post-save refresh.** After saving, fields are updated via `setValue` without
  remounting the form (`hasLoadedOnce` guard). This avoids a visible spinner on every save.

## Usage

```tsx
<FormView
  window={windowMetadata}
  tab={tab}
  mode={FormMode.EDIT}
  recordId={recordId}
  setRecordId={setRecordId}
  uIPattern={UIPattern.STANDARD}
/>
```

`FormView` wraps children in `FormProvider` (react-hook-form) and `FormViewContext`. Any child
that needs form values must be rendered inside this tree.

## Related

- [`hooks/useFormInitialization.md`](../../hooks/useFormInitialization.md) — default value
  population for new records
- [`features/form-validation.md`](../../features/form-validation.md) — validation rules
- [`features/field-references.md`](../../features/field-references.md) — field type reference
- [`features/enhanced-callout-manager.md`](../../features/enhanced-callout-manager.md) — callout
  execution lifecycle
- [`troubleshooting/display-logic-implementation-en.md`](../../troubleshooting/display-logic-implementation-en.md)
  — display logic expression debugging
