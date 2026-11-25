# Date column filter

How the filter of a date or date-time column works in the grid (ETP-6297). It filters by **one date**, by a **range**,
or by an **open range** ("from" or "to" only), with the dates picked in a calendar or typed. It applies to every grid
column rendered by `Table/DateSelector`: header and child tabs, and the grids of selector popups.

## Behavior

### The "Select dates" window

The calendar icon of the column opens the window. A switch at the top chooses how the dates are picked:

| Mode | Fields | Calendar click | Filters |
|------|--------|----------------|---------|
| **One date** (default when the column has no filter) | "Date" | Sets the day | That day only |
| **Range** | "From" and "To" | First click sets "From", the second "To" (swapped if earlier), a third starts again | From–To, both included; "From" only = that day onward; "To" only = up to that day |

- A column that already has a filter reopens the window in the mode of that filter, with its dates and its month.
- Switching mode keeps "From" / "Date". The end is dropped when switching to one date.
- A summary above the buttons says what will be filtered before confirming, for example "Filters: 13/10/2026",
  "Filters: From 01/10/2026" or "No date filter".
- **Typing.** "Date", "From" and "To" can be typed in the format shown (the placeholder). A typed date is applied
  when leaving the field or pressing Enter. It moves the calendar to its month and has the same result as picking
  it. An inverted range is swapped, as with the calendar.
- **Invalid date.** Typed text that is not a real date (for example `31/02/2026` or text) is marked in red with
  "Invalid date", and Confirm is disabled until it is fixed or cleared.
- "Clear filters" empties the dates. Confirming with no dates removes the filter.

### The column filter field

- After confirming, the field shows what is applied: `13/10/2026`, `01/10/2026 - 31/10/2026`,
  `From 01/10/2026` or `To 31/10/2026`. The same text is used for a filter that comes from "Use as filter" or a saved
  view.
- **Typing a date** in the field filters that whole day. It is applied 500 ms after the user stops typing, or at
  once with Enter or when leaving the field.
- **Filter expressions** keep working and are sent as typed, e.g. `>=01/10/2026`, `!13/10/2026`,
  `01/10/2026 - 31/10/2026`, or values joined with `or` / `and` / `|` / `&`.
- **Invalid text** (neither a date nor an expression) is not applied. When leaving the field, or with Enter, it is
  marked with a red underline and the "Invalid date" tooltip. The previously applied filter stays.
- "Use as filter" of the grid keeps filtering by the date of the selected record. The window then reopens in
  "One date" with that day.

### Date-time columns

One day also filters every record of that day in a date-time column (e.g. "Creation Date"), whatever its time.
The backend does it: `AdvancedQueryBuilder` turns `equals` on a date or date-time property into
`>= day 00:00:00 and <= day 23:59:59.999`. `greaterOrEqual` / `lessOrEqual` with a plain date move to the start
or the end of the day.

## Filter value and criteria

The value stored for the column, and sent to the criteria builder, keeps the format it already had. Saved views,
"Use as filter" and the criteria builder needed no change.

| Selection | Stored value | Criteria (`LegacyColumnFilterUtils`) |
|-----------|--------------|--------------------------------------|
| One date | `2026-10-13` | `equals 2026-10-13` |
| Range | `2026-10-01 - 2026-10-31` | `greaterOrEqual 2026-10-01` + `lessOrEqual 2026-10-31` |
| From only | `2026-10-01 - ` | `greaterOrEqual 2026-10-01` |
| To only | ` - 2026-10-31` | `lessOrEqual 2026-10-31` |
| Typed expression | As typed | Parsed by `parseLogicalFilter` (unchanged) |

A date typed in the column is converted to `YYYY-MM-DD` before it is applied, so the backend never receives an
ambiguous `dd/mm` or `mm/dd` value.

## Decisions

- **A "One date / Range" switch** rather than "one click = one day". The window always shows which kind of filter
  will be applied, and open ranges stay reachable from the calendar. It is the default mode because filtering one
  day was the case with no obvious way to do it.
- **Typed dates are read in the browser's locale order**, the same rule that displays the dates
  (`formatBrowserDate`). Day and month may have one or two digits and any of the separators `/ - .`, and the year
  has four digits. ISO `YYYY-MM-DD` is always accepted. Dates that do not exist are rejected instead of being
  rolled over, as Java's lenient parsing would do on the server.
- **The column marks an invalid date on blur or Enter, not while typing**, so an incomplete date is not reported
  in the middle of typing. Classic also validates on blur.
- **Expressions pass through unchanged** so the filters that already worked keep working (no regression).
- **The value format did not change**, so the change is client-only and compatible with stored saved views.

## Reuse by other tasks

- **ETP-6290 (format rule).** Parsing and display of dates live in `ComponentLibrary/src/utils/dateFormatter.ts`
  (`getLocaleDateOrder`, `parseLocaleDate`, `formatBrowserDate`, `toISODate`). Applying the regional rule there
  updates this filter with no further change.
- **ETP-6291 (pickers).** The "One date" mode, the typed-date handling and the selection state
  (`useDateFilterSelection`) are the base for a single-date picker. The texts of the window are in the locale
  files under `dateModal.*`.

## Differences with Classic

| Classic (`OBMiniDateRangeItem`) | New UI |
|---------------------------------|--------|
| A typed date applies on blur | Applies after 500 ms of no typing, or at once on blur / Enter |
| Range dialog accepts relative dates ("today", "N days ago") | Absolute dates only |
| `#` filters empty values and `!#` non-empty ones | Not supported: reported as an invalid date |
| One date: type it in the column | Type it in the column, or pick it in "One date" mode |

## Main files

| File | Role |
|------|------|
| `packages/ComponentLibrary/src/components/RangeDateModal/RangeDateModal.tsx` | "Select dates" window: mode switch, typed fields, summary |
| `packages/ComponentLibrary/src/components/RangeDateModal/useDateFilterSelection.ts` | Window state: selection, visible month, invalid typed dates |
| `packages/ComponentLibrary/src/components/RangeDateModal/dateFilterSelection.ts` | Build, read and describe the filter value; calendar and mode rules |
| `packages/ComponentLibrary/src/utils/dateFormatter.ts` | Locale date order, strict typed-date parser, `toISODate` |
| `packages/MainUI/components/Table/DateSelector.tsx` | Column filter field: typed dates, invalid mark, window |
| `packages/MainUI/utils/table/filters/dateColumnFilter.ts` | Resolves typed text into a date, an expression or invalid |
| `packages/api-client/src/utils/search-utils.ts` | Criteria builder (unchanged) |

Related: [Column filters](../column-filters/README.md),
[Grid paging and record count](../grid-paging-and-record-count/README.md).
