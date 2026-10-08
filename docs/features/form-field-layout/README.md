# Form field layout

How fields are placed in the form view grid, and which fields take the full row width.

**Last updated:** 2026-10-08 (ETP-4636)

**Related:** the original design of the layout metadata support (`startnewline`,
`startinoddcolumn`, `obuiappColspan`, `obuiappRowspan`) is in
[`superpowers/specs/2026-06-09-form-layout-gaps-design.md`](../../superpowers/specs/2026-06-09-form-layout-gaps-design.md).
Reference IDs are listed in [`field-references.md`](../field-references.md).

---

## Behavior

Each form section renders its fields in a 3-column CSS grid (`grid-cols-3 gap-x-5`,
`FormFieldsContent.tsx`). Every field shows its label and its editor side by side.

| Field | Width | Height |
|-------|-------|--------|
| Regular field | 1 column (or `obuiappColspan`) | 1 row (or `obuiappRowspan`) |
| Long text (`14`), Memo (`34`), Rich Text | **Full row (3 columns)** | `row-span-4` (or `obuiappRowspan`) |
| Image, Multi selector | 1 column (or `obuiappColspan`) | `row-span-4` (or `obuiappRowspan`) |

Full-width fields:

- always start on column 1 of a new row and close that row, so the next field starts
  on column 1;
- ignore `startinoddcolumn` (column 1 is already odd);
- keep a label as wide as the label of a single-column field, so labels stay aligned
  across rows; the editor takes the rest of the row.

An explicit `obuiappColspan` always wins: a long-text field with a colspan defined in
the metadata behaves like any other field with that colspan.

## Decisions

- **Only text references are widened.** Classic widens text areas
  (`OBViewFieldHandler.getColSpan`) and explicitly excludes images; the multi selector
  keeps its current layout too.
- **Full row instead of Classic's half row.** Classic uses a 4-column grid where a text
  area spans 2 columns. The new UI grid has 3 columns, so half a row is not possible;
  the full row is the closest match and gives the widest editing area.
- **The rule lives in one place.** `isFullWidthField` / `getEffectiveColspan` are used
  both by the placement cursor (`computeFieldLayout`) and by the rendered classes
  (`getFieldLayoutClasses`), so grid placement and CSS never disagree.
- **Label width is derived from the grid.** `w-[calc((100%-2.5rem)/9)]` is a third of
  one column: the row minus the two `gap-x-5` (1.25rem) gaps, divided into 3 columns.
  If the grid gap changes, this constant in `BaseSelector.tsx` must change with it.

## Configuration

None required. To keep a long-text field narrower, set **Colspan**
(`obuiappColspan`) on the AD Field.

## Differences with Classic

- Classic: text areas take half of a 4-column row; new UI: full 3-column row.
- Classic also widens any field with `displayedLength > 60`; the new UI does not.
- `obuiappColspan` values are applied as-is on the 3-column grid (values above 3 have
  no CSS class and fall back to auto placement, unchanged by this feature).

## Main files

| File | Role |
|------|------|
| `packages/MainUI/utils/form/computeFieldLayout.ts` | `isFullWidthField`, `getEffectiveColspan`, column-start computation |
| `packages/MainUI/components/Form/FormView/selectors/BaseSelector.tsx` | `getFieldLayoutClasses`: span, height and label/editor width classes |
| `packages/MainUI/components/Form/FormView/FormFieldsContent.tsx` | Section grid; passes `colStart` to each field |
