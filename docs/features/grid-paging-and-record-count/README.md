# Grid paging and record count

How a tab grid loads its records page by page while the user scrolls, and how it counts them, as the Classic
grid does (ETP-6303). It applies to every grid that loads through `useDatasource`: header and child tabs, tree
mode, Pick & Execute grids and selector popups. The dropdown options of TableDir and Select fields
(`useTableDirDatasource`) page by the same rule.

## Behavior

| Rule | Classic | New UI |
|------|---------|--------|
| Page request | `_startRow` / `_endRow`, with `_endRow` **inclusive**: the server reads `endRow - startRow + 1` rows | Same params. A page asks for `pageSize + 1` rows (`0..100` with the default size of 100), as Classic does |
| Extra row | Tells the grid that more records exist | Same: a page with at least `pageSize` rows means more records may follow |
| Next page | Starts right after the last row loaded (`endRow + 1` of the previous answer) | Same: it starts at the number of server rows loaded so far (`101` after a first page of 101 rows) |
| Repeated records | None | None. As a safety net, rows whose record is already loaded are left out, so two overlapping loads never show a record twice |
| Empty page after the last record | The server fetches again from row 0 and answers `startRow: 0` | That answer is recognised and ends the paging, without appending the first rows again |
| Record deleted from the grid | The cached rows after it move up | The next page starts one row earlier, so the record that moved up is not skipped |
| Record count | No total in the grid | The loaded rows followed by `+` while more records exist (`(101+ records)`), the exact number once every record is loaded or the query fits in one page |

The count follows the same rule wherever it is shown: the window title (root tab), the badge of a child tab and
the "Showing N records" bar of grids that keep their own counter. It changes with filters, the implicit filter,
refreshes and records created or deleted, because it is always derived from the loaded rows and from whether the
datasource has more.

### Child tab badge

The badge of a child tab keeps its place in the tab strip before its count is known (ETP-6431). A child tab only
loads its grid when it is opened, or when the pointer passes over it (the tab is prewarmed), so its count arrives
late, and it is cleared while several parent records are selected. Until then the badge is an empty pill with a
soft pulse, `aria-hidden` and marked `data-loading="true"`, of the same width as the count. The width is reserved
for four characters with tabular digits, so `7`, `42`, `100` and `101+` all fit and the tabs to its right never
move when the count arrives or changes. Only a count of five characters or more (`1010+`, after scrolling a large
child tab) widens it. No count is loaded for a tab that was not visited: the badge only reserves the space.

## Decisions

- **No total count.** Showing the real total would need a count query (`_onlyCount`) on every load, filter and
  refresh of every grid and child tab, which costs most on the largest tables (Process Monitor has more than
  13,000 records). `N+` never presents a partial number as the total, adds no request and keeps the first load as
  fast as before. Classic does not show a total either.
- **Offset from the loaded rows, not from the page number.** Because the Classic `_endRow` is inclusive, a page
  number times the page size points at the last row of the previous page; that is what repeated one record per
  page (G/L Journal showed 120 records for 119).
- **Dropdown options too.** A field dropdown asked for its next options with the page number, so the first scroll
  to its end fetched the first page again and showed nothing new (the dropdown already left out repeated
  options), and each later page overlapped the previous one by a row. It now starts each page right after the
  last option loaded and stops when the server answers the first rows again.
- **Reserved badge instead of loading every count.** Loading the count of every child tab when a record is
  selected would add a request per tab; Classic shows no count at all. The badge reserves the space instead, as the
  task asks (an empty or loading badge that the number fills).
- **Page size unchanged.** The size comes from the `dataPageSize` preference
  ([classic preferences](../classic-preferences/README.md)); saved views are not involved.

## Configuration

None.

## Differences with Classic

- The new UI shows a count (`N+` or exact); Classic shows none in the grid.

## Main files

- `packages/MainUI/hooks/useDatasource.ts`: page requests, offset of the next page, end of paging, local removals.
- `packages/MainUI/hooks/datasource/useTableDirDatasource.ts`: the same offset and end of paging for the options
  of TableDir and Select fields.
- `packages/MainUI/utils/table/datasourcePaging.ts`: pure helpers (page range, restarted answer, appending
  without repeated records, first page replacement).
- `packages/ComponentLibrary/src/components/Table/RecordCounters/formatRecordCount.ts`: the `N+` rule, used by the
  record counter bar, the title count (`components/Table/index.tsx`) and the child tab badge
  (`components/window/TabButton.tsx`, `stores/tabCountsStore.ts`, `hooks/table/useTabRecordCount.ts`).
  `TabButton.tsx` also holds the reserved badge (`TabCountBadge`, `TAB_COUNT_BADGE_CLASSES`).
- `playwright-tests/e2e/regression/10_Grid/GRDkGridPagingAndCountTest.spec.ts`: end-to-end check (see the
  [E2E suite](../../testing/playwright-e2e/README.md)).

Related: [grid default sort](../grid-default-sort/README.md) (the order the pages follow),
[CSV export](../csv-export/README.md) (reads every record of the grid query at once).
