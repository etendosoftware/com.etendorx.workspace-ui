# Callout Changed-Field Highlight

When a callout runs, the fields whose value it changed show a brief tint that fades out, so the user can see
what the callout touched. It applies to the form view and to rows edited inline in the grid. How callouts run and
how their values are applied is described in [Callouts: Execution Model and Data Flow](../../callouts-behavior.md).

## Behavior

- After a callout response is applied, every visible field whose value **actually changed** is highlighted.
  Fields the response returned with the same value they already had are not highlighted.
- The tint lasts `CALLOUT_HIGHLIGHT_DURATION_MS` (1500 ms) and fades out with a CSS animation.
- If a field is changed again by another callout before its highlight ends, the fade restarts.
- The highlight is a decorative overlay (`aria-hidden`, `pointer-events: none`): it does not take the focus, block
  clicks or typing, or change the layout, so the user can keep editing a highlighted field.
- With `prefers-reduced-motion: reduce` the tint is shown without animation and removed when the duration ends.

### What is highlighted

| Source | Highlighted |
|--------|-------------|
| `columnValues` of a field of the tab whose value changed | Yes |
| `columnValues` of a field whose value did not change | No |
| `columnValues` keys that do not match any field of the tab | No |
| `auxiliaryInputValues` (not visible fields) | No |
| Values applied by form initialization, refresh after save or default values | No (they are not callouts) |
| Callouts of process parameters (Process modal) | No (out of scope) |

## Decisions

- **Change detection on the client.** The FIC (`FormInitializationComponent`, CHANGE mode) returns every field of
  the tab in `columnValues`, with no per-column "changed" flag; its own list of changed columns is only used
  server-side. The client therefore compares each returned value with the value the field held before the
  callout, the same way Classic flags `_changedByFic` in `processColumnValue`.
- **Comparison rules** (`areCalloutValuesEqual`): `null`, `undefined` and `""` are equal; two numeric values are
  compared by value (`10` and `"10.00"` are equal); anything else is compared as text. Boolean fields are compared
  after converting the Classic encoding (`"Y"` / `""`) to `true` / `false` (`toCalloutFieldValue`), so a callout
  returning the same boolean does not highlight it.
- **One store update per callout.** The changed field names are published once per response to a small Zustand
  store keyed by scope (`form:<tabId>` or `grid:<tabId>:<rowId>`). Each callout gets a token: the clear timer only
  removes fields still holding its token, and the overlay is keyed by the token so a new change restarts the fade.
- **Minimal re-renders.** Each field renders a `CalloutHighlightOverlay` that subscribes to its own token only, so
  a callout that changes many values re-renders just the overlays of those fields, and the fade runs on `opacity`.

## Differences with Classic

Classic does not show any highlight: it only flags `_changedByFic` to decide which fields to re-validate after the
FIC returns, and the grid explicitly disables SmartClient's edit-pending cell style. The highlight is a new UI
affordance that reuses Classic's change criterion (old value vs. new value).

## Configuration

None. The duration is the `CALLOUT_HIGHLIGHT_DURATION_MS` constant and the color derives from the
`--color-dynamic-main` theme token (`.callout-highlight-overlay` in `app/styles/global.css`).

## Main files

| File | Role |
|------|------|
| `packages/MainUI/utils/callouts/calloutHighlight.ts` | Duration, scopes, boolean conversion, value comparison, changed-field diff |
| `packages/MainUI/stores/calloutHighlightStore.ts` | Highlighted fields per scope, token and timed clear |
| `packages/MainUI/components/CalloutHighlightOverlay.tsx` | Decorative overlay rendered inside each field |
| `packages/MainUI/components/Form/FormView/selectors/BaseSelector.tsx` | Form: diff in `applyColumnValues`, overlay in the input column |
| `packages/MainUI/components/Table/utils/calloutUtils.ts` | Grid: `getCalloutChangedFieldNames` for a row |
| `packages/MainUI/components/Table/index.tsx` | Grid: highlight in `applyCalloutValuesToRow`, overlay in the editable cell |
| `packages/MainUI/app/styles/global.css` | `.callout-highlight-overlay` style and fade animation |
