# Selector loading state (ETP-6431)

While a selector searches its options on the server, its dropdown shows that it is loading. "No options found"
only appears when the search has finished without matches. It applies to the selectors of forms and process
parameters, the selector editors of the grid, and the dropdown column filters.

## Behavior

A selector waits before searching the typed term (500 ms of debounce), and the server then answers. Meanwhile the
dropdown keeps the options of the previous term, filtered by the new term in the browser, which often leaves none.
Before this change that empty list read "No options found" until the answer arrived, and the user could stop
searching.

| Selector | Component | While waiting and loading |
|----------|-----------|---------------------------|
| Form and process parameter selectors (TableDir, Table, Search, Product, Select) | `Select` | Loading row; the matching options stay, with the loading row after them |
| Grid selector editor (TABLEDIR) | `TableDirCellEditor` | Loading text in the list; an older answer that arrives late is ignored |
| Grid column filters | `MultiSelect`, `TreeColumnFilter` | Loading row, also when the tree filter loads its own options |
| Process grid column filters (Pick and Execute) | `useGridColumnFilters` | The column is marked as loading before the fetch, as in the main grid |
| Tree selector | `TreeSelector` | Unchanged: it searches locally; texts now translated |

A term below the minimum number of characters of a search selector is never searched: the dropdown shows the hint
instead, without loading.

A search typed while another load of the same field is running (the first page, or the next one while scrolling)
used to be dropped, which left "No options found" for good. It now runs as soon as that load ends; only the last
one is kept.

The texts are the translation keys `common.loading` and `multiselect.noOptionsFound`.

## Decisions

- **Pending search counts as loading.** The same rule `MultiSelect` already followed (`isDebouncing`), moved to a
  shared hook (`usePendingSearch`) for `Select`.
- **Queue only typed searches.** A dropped focus reload is not queued, so no new requests are sent outside the
  case that lost the search.
- **Latest answer wins in the grid editor.** The editor searched on every keystroke without cancelling; an older
  answer could replace a newer one.

## Configuration

None.

## Differences with Classic

None in behavior: the dropdowns keep their own design.

## Known limitation

`Select` filters the server answer again in the browser by the visible label, so a server match whose label does
not contain the term may be hidden. This predates the task and is not changed here.

## Main files

- `packages/MainUI/utils/selectorUtils.ts` (`usePendingSearch`).
- `packages/MainUI/components/Form/FormView/selectors/components/Select/Select.tsx`.
- `packages/MainUI/hooks/datasource/useTableDirDatasource.ts` (`runPendingSearch`).
- `packages/MainUI/components/Table/CellEditors/TableDirCellEditor.tsx` (`searchesOnServer`).
- `packages/MainUI/components/Table/TreeColumnFilter.tsx`, `packages/MainUI/hooks/table/useGridColumnFilters.ts`.
- `packages/MainUI/components/Form/FormView/selectors/TreeSelector.tsx`.

Related: [grid paging](../grid-paging-and-record-count/README.md) (paging of the dropdown options),
[column filters](../column-filters/README.md).
