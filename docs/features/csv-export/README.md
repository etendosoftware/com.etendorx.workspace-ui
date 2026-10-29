# CSV export ("Export to Spreadsheet")

The **Export to Spreadsheet** toolbar button downloads the records of the grid as a CSV file
(`ExportedData.csv`). The file holds **the same records, in the same order, as the grid**:
every filter the user applied, every sorted column, and every row (there is no row limit).

## Behavior

| Aspect | Result in the file |
|--------|--------------------|
| Filters | Same as the grid: column filters of every type (text, list, date range, numeric expressions), the quick search, the implicit filter, advanced filters and, for child tabs, the selected parent record |
| Order | Same as the grid: every sorted column in order, each with its direction. A grouped grid is sorted by the grouped column first |
| Rows | Every matching record. No paging is sent, so the server writes all of them |
| Columns | The grid columns, in the grid order (Classic grid sequence, then the order the user gave the columns) and with the grid visibility. Buttons, images and hidden columns are left out |
| View mode | Works in grid, split and form view. In form view it exports the grid behind the form |

The button stays busy until the file is downloaded. Errors are shown as a toast.

## How it works

```mermaid
flowchart LR
  Button[Toolbar: EXPORT_CSV] --> Action[exportCSV action, owner TAB]
  Action --> Hook[useGridCsvExport]
  Hook -->|getRequestParams| Grid[useTableData / useDatasource: the grid's current query]
  Hook --> Util[exportGridToCsv]
  Util -->|grid query without paging + exportAs=csv| Proxy[/api/datasource]
  Proxy --> Classic[DataSourceServlet: QueryJSONWriterToCSV]
  Classic -->|CSV text| Util
  Util --> Download[ExportedData.csv]
```

1. `useDatasource` keeps the params of the grid's current request: the criteria (parent, column
   filters, search, implicit and advanced filters), the `sortBy`, the session context and
   `isImplicitFilterApplied`. It exposes them, without paging, through `getRequestParams`.
   `useTableData` returns this function.
2. The grid (`components/Table/index.tsx`) builds the export with `useGridCsvExport` and registers
   it as the `exportCSV` toolbar action.
3. `exportGridToCsv` does three things:
   - takes those params and drops what only belongs to one page of the grid (`pageSize`,
     `startRow`/`endRow`, and `targetRecordId`/`directNavigation`);
   - adds Classic's export params: `exportAs=csv`, `exportToFile=true`, `viewState`, `tabId`,
     `_textMatchStyle`, `_UTCOffsetMiliseconds`;
   - sends the request through the datasource proxy and downloads the CSV the server returns.

## Decisions

- **The export reuses the grid's query.** Before, the export rebuilt its own request:
  - it sent the raw grid filter state, which the server cannot read, so filters were ignored;
  - it sent the sort column without its direction;
  - it limited the request to 10,000 rows.

  Reusing the exact params the grid loaded its data with means any filter the grid supports,
  now or later, is exported without converting it a second time.
- **The grid registers the action under the `TAB` owner.** The export belongs to the tab whichever
  pane is visible. But only the grid knows its query, and the `GRID` owner bucket is cleared while
  the form is shown (see `utils/toolbar/actionOwnership.ts`).
- **The columns are the grid columns.** The server takes the exported columns, and their order,
  from `viewState.field`. The export builds that list with the rules of the grid itself:
  - the order comes from `sortFieldsByGridOrder` and then `TableState.order`;
  - fields that are never grid columns are dropped with `isGridRenderableColumn`;
  - visibility is keyed by the grid column id (`field.name`).

  This matches Classic, which sends the view state of its grid.
- **No row limit, no warning.** This matches Classic. The server scrolls the results and writes them
  as it reads them (`DefaultJsonDataService.fetch` with `QueryJSONWriterToCSV`).
- **Every sorted column is sent, by both the grid and the export.** The grid lets the user sort by
  several columns (Shift+click). The datasource receives them all as
  `_sortBy=-orderDate,documentNo`, which `AdvancedQueryBuilder` already supports. This keeps the
  grid order and the file order the same.

## Differences with Classic

| Aspect | Classic | New UI |
|--------|---------|--------|
| Sort | Only the first sorted column is exported | Every sorted column, in the grid order |
| Form view | Button disabled | Exports the grid behind the form |
| Tree view | Button disabled | Exports the records with the grid filters, as a flat list |
| Download | Hidden form posted to the datasource | Request through the `/api/datasource` proxy, which returns the CSV text. The client then builds the file |

Columns, headers, value formatting and the separator preferences (`OBSERDS_CSV*`) are handled by
Classic's `QueryJSONWriterToCSV`, so they are the same in both interfaces.

## Configuration

None. The CSV preferences of Classic (`OBSERDS_CSVFieldSeparator`, `OBSERDS_CSVDecimalSeparator`,
`OBSERDS_CSVTextEncoding`, `OBSERDS_CSVHeaderMessage`, `OBSERDS_CSVFooterMessage`) still apply.

## Main files

- `packages/MainUI/utils/export/csvExport.ts`: request params, view state, response parsing and download.
- `packages/MainUI/hooks/table/useGridCsvExport.ts`: the `exportCSV` action of a grid.
- `packages/MainUI/hooks/useDatasource.ts`: `getRequestParams`.
- `packages/MainUI/hooks/table/useTableData.tsx`: the grid query, including the sort by every column.
- `packages/MainUI/utils/table/grouping.ts`: `buildMultiSortBy`, `buildGroupedMultiSortBy`, `resolveEffectiveSorts`.
- `packages/MainUI/components/Table/index.tsx`: registers the action.

## Related

- [Column filters](../column-filters/README.md): how column filters become criteria.
- [Grid grouping](../grid-grouping.md): sort of a grouped grid.
- [Table state persistence](../table-state-persistence/README.md): where filters, sort and visibility live.
