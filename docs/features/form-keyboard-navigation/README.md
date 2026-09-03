# Form keyboard navigation

How the form view behaves under the keyboard, and the contract every field editor
must honour so that Tab keeps working.

Etendo Classic is built to be driven from the keyboard: an advanced user opens a
record, the caret lands on a field, and Tab walks the form field by field without
ever touching the mouse. This document describes how that behaviour is reproduced
in the new UI, and what a new selector has to do to take part in it.

**Related:** [`keyboard-shortcuts-focus-system.md`](../keyboard-shortcuts-focus-system.md)
covers a different concern — which *view* (header form, lines grid…) receives
application shortcuts. This page is about the DOM focus **inside** one form.
[`menu-search-keyboard-navigation`](../menu-search-keyboard-navigation/README.md) covers
the drawer's menu search, where Tab has the opposite role: it completes the search term
rather than moving between controls.

---

## The tab-sequence contract

Four rules, all derived from Classic. Everything below is an application of them.

1. **A field is a single tab stop.** The editable control takes the focus; every
   auxiliary control of the field — clear "X", calendar and clock icons, the
   record-picker magnifier, the process launcher — is reachable with the mouse
   only. Classic renders those as picker icons, which are not tab stops either;
   it exposes them through shortcuts instead.
2. **Read-only fields are not focusable.** Classic renders a read-only form item
   with `disabled: true` (`ob-view-field.js.ftl`), so the browser skips it. In the
   new UI a read-only editor must set the `disabled` attribute, not only
   `readOnly` — a read-only input is still a tab stop.
3. **Labels never take the keyboard.** The label of a reference field is a link
   that navigates to the referenced window. It stays clickable, but out of the tab
   sequence.
4. **The focus never leaves the form by accident.** Dropdowns render through a
   portal on `document.body`; Tab inside one is handled explicitly so it lands on
   the neighbouring field rather than on whatever follows the portal in the DOM.

---

## Initial focus

When a form opens, the first editable field takes the keyboard. The resolution
order mirrors `OBViewForm.computeFocusItem` of Classic:

| Order | Rule | New UI |
|---|---|---|
| 1 | First field with a validation error | Not implemented (the new UI has no form-level error item yet) |
| 2 | `forceFocusedField` | Not implemented |
| 3 | `firstFocusedField` | `AD_Field.ISFIRSTFOCUSEDFIELD`, reaching the client as `Field.isFirstFocusedField` |
| 4 | First focusable item, skipping section headers | First focusable control in DOM order that belongs to a field |

`isFirstFocusedField` needs no backend work: `FieldBuilder` serialises the whole
`AD_Field` (`converter.toJsonObject(field, FULL_TRANSLATABLE)`), and the DAL
property is already named `isFirstFocusedField`. A flagged field that cannot take
the focus (read-only, hidden, inside a collapsed section) falls through to rule 4.

Rule 4 only considers controls that live inside a `[data-form-field-name]`
wrapper — this is the counterpart of Classic's `!isc.isA.SectionItem(item)`. The
form chrome sits in the same container and would otherwise win, because it comes
first in the DOM: the two decorative icons of every section header (rendered as
buttons), and the buttons of the Notes / Attachments / Linked Items sections.

### When it fires

`useFormInitialFocus` re-places the focus once per *situation*, keyed on
`${formInstanceKey}:${recordId}:${mode}`:

- the form is opened from the grid;
- a new record is created;
- the user navigates to another record with the header arrows;
- the form pane takes over the keyboard with **F6** in split view.

It deliberately does **not** fire on a data refresh (a post-save refetch keeps the
same key), and it never pulls the caret out of a field the user is already in —
blurring a field runs its callout.

The attempt is also **retried** whenever the expansion state of the sections
changes, through a `layoutToken`. This is not an optimisation, it is required:
`expandedSections` starts empty and is only seeded from the metadata once the
tab's fields have arrived, so on the first renders *every* section is collapsed —
`Collapsible` marks it `aria-hidden` and neutralises the `tabindex` of everything
inside — and a single attempt would find no field at all and give up.

### Debugging

`localStorage.setItem("DEBUG_FORM_FOCUS", "true")` (or `NEXT_PUBLIC_DEBUG_FORM_FOCUS`)
traces every decision point: whether the hook was enabled, whether the fields root
existed, whether a field was found, and which element ended up focused.

It writes through `console.debug`, not through `logger.debug` — the latter is a
no-op regardless of any flag, since `Logger.enableDebugLogs` is hardcoded to
`false`.

### Split view

The form only claims the focus while it owns the keyboard. `Tab.tsx` passes
`canAutoFocus={isFormPaneFocused}`, which is false while the grid pane holds the
DOM focus. So clicking a grid row loads the record into the form and leaves the
caret in the grid, exactly as Classic does. Pressing **F6** moves the focus to the
form; `resolvePaneFocusTarget` then hands it straight to the first editable field
instead of to the pane container, which would otherwise walk the form header
(section tabs and the record-navigation arrows) first.

---

## Shortcuts

| Shortcut | Action | Classic equivalent (`OBUIAPP_KeyboardShortcuts`) |
|---|---|---|
| `Ctrl+Enter` | Opens the record picker of a reference field | `Selector_ShowPopup` |
| `Space` | Toggles a boolean field | `isc.CycleItem.handleKeyPress` |
| `Enter` / `Space` | Opens a dropdown or activates a picker from its trigger | — |
| `↑` / `↓` | Moves the highlight inside an open dropdown | — |
| `Tab` / `Shift+Tab` | Commits the highlighted option and moves to the next / previous field | Classic combo box behaviour |
| `Escape` | Closes an open dropdown | — |
| `F6` | Moves the focus to the other pane in split view | — |

`Ctrl+Enter` is handled on the field itself, not through `useKeyboardShortcuts`:
that hook listens on `document`, so every mounted field would answer at once.

Not implemented yet: `ViewForm_OpenLinkOut` (`Ctrl+Alt+Enter`), Classic's keyboard
path to the referenced window. `useKeyboardShortcuts` would need to grow support
for `alt` combinations first — its `normalizeKey` only distinguishes `ctrl`.

### Boolean fields

Classic renders a YES_NO field as `OBCheckboxItem`, which extends SmartClient's
`CheckboxItem` → `CycleItem`. Its whole keyboard contract is:

```js
handleKeyPress: function () {
  var key = isc.EH.getKey();
  if (!this.isReadOnly() && key == "Space") { this.advanceValue(); return false; }
  return this.Super("handleKeyPress", arguments);
}
```

So: **Space toggles**, the default is cancelled (the page does not scroll), and
**Enter does not toggle** — it falls through to the form. Clicking also focuses
the item first (`handleClick` → `focusInItem()` → `advanceValue()`), and the value
is committed on `changed`, not on blur, so the callout fires immediately.

The new UI renders the field as a `<button role="switch">`, which natively
activates on both Space and Enter. Space is handled explicitly so the behaviour is
the one above rather than the browser's, and so the default is cancelled exactly
where Classic cancels it. **Enter still toggles**, which is the one remaining
divergence.

---

## DOM contract

Two attributes make the sequence resolvable, both defined in
[`utils/form/focus.ts`](../../../packages/MainUI/utils/form/focus.ts):

| Constant | Rendered on | Purpose |
|---|---|---|
| `FORM_FIELDS_ROOT_ATTRIBUTE` (`data-form-fields-root`) | The sections container of `FormFieldsContent` | Root of the tab sequence — bounds every lookup |
| `FORM_FIELD_NAME_ATTRIBUTE` (`data-form-field-name`) | The wrapper each `BaseSelector` renders | Locates one field by `hqlName` |

`findFocusableFields` returns every tab stop under a root — the browser's real Tab
order, which is what adjacent-field navigation has to mirror.
`findFocusableFieldControls` narrows that to the ones inside a
`[data-form-field-name]` wrapper, and is what the initial focus and the split-pane
target use.

A control counts as a tab stop when it is not `disabled`, does not carry
`tabindex="-1"`, is not a hidden input, and does not live inside an
`aria-hidden="true"` subtree. That last condition is what excludes collapsed
sections: `Collapsible` marks its content `aria-hidden` and neutralises the
`tabindex` of everything inside it. Visibility is deliberately **not** decided
through layout (`offsetParent`, `getBoundingClientRect`) so the rules stay
testable under jsdom.

### Writing a new field editor

1. Render exactly one focusable control. Give every internal button
   `tabIndex={NOT_TABBABLE}`.
2. When read-only, set `disabled` on the control — `readOnly` alone leaves it in
   the tab sequence.
3. If an auxiliary button can disappear after being used (a clear button vanishes
   with the value), call `focusOwningField(event.currentTarget)` so the keyboard
   returns to the field instead of falling back to `document.body`.
4. If the editor opens a dropdown in a portal, handle `Tab` yourself:
   `findAdjacentFocusableField(trigger, offset)` gives the neighbouring field, and
   returns `null` outside a form (in the process modal, for instance), where
   closing and restoring the focus to the trigger is the right fallback.

---

## Files

| File | Role |
|---|---|
| `utils/form/focus.ts` | Focusability rules, field lookup, adjacent-field navigation |
| `utils/form/keyboard.ts` | Field-level shortcut predicates and the dropdown-portal selector |
| `hooks/useFormInitialFocus.ts` | Places the initial focus, with its guards |
| `components/Form/FormView/index.tsx` | Resolves the flagged field and the focus key |
| `components/Form/FormView/FormFieldsContent.tsx` | Marks the fields root |
| `components/Form/FormView/selectors/BaseSelector.tsx` | Marks each field wrapper |
| `components/Form/Collapsible.tsx` | Section header icons out of the sequence; neutralises a collapsed section |
| `components/Form/FormView/selectors/GenericSelector.tsx` | `Ctrl+Enter` picker shortcut; magnifier and "+" out of the sequence |
| `components/Form/FormView/selectors/components/Select/Select.tsx` | Focus restore after selecting, Tab out of the dropdown |
| `components/Form/FormView/selectors/components/Switch.tsx` | Space toggle of a boolean field, visible focus ring |
| `components/Label/index.tsx` | Reference label kept out of the sequence |
| `hooks/navigation/useRedirect.ts` | Cancels only the activation keys, so Tab is never swallowed |
| `utils/window/splitView.ts` | Pane focus target, form branch included |

## Tests

| Test | Covers |
|---|---|
| `utils/form/__tests__/focus.test.ts` | Focusability rules, field lookup, adjacent navigation, focus restore |
| `hooks/__tests__/useFormInitialFocus.test.tsx` | When the initial focus fires and when it must not |
| `.../Select/__tests__/Select.keyboard.test.tsx` | Focus after selecting, Tab and Shift+Tab out of the dropdown |
| `.../components/__tests__/textInputsTabSequence.test.tsx` | Single tab stop per text field, clear button, read-only |
| `.../components/__tests__/Switch.keyboard.test.tsx` | Space toggles a boolean field, read-only ignores it, focus ring |
| `.../selectors/__tests__/GenericSelector.test.tsx` | `Ctrl+Enter` picker shortcut and the cases it ignores |
| `.../selectors/__tests__/DateInput.test.tsx` | Calendar button and read-only date fields |
| `utils/window/__tests__/splitView.test.ts` | Pane focus target for the form pane |
| `components/Form/FormView/__tests__/Label.test.tsx` | Reference label out of the tab sequence |
| `hooks/navigation/__tests__/useRedirect.test.ts` | Only activation keys are cancelled |
