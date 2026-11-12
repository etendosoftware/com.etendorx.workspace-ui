# Grid default sort

Initial order of a tab grid when the user has not sorted it yet, reproducing the classic UI
(`OBViewGridComponent` + `ob-view-grid.js`).

## Behavior

| Rule | Classic | New UI |
|------|---------|--------|
| Source | `AD_Tab.HQLOrderByClause` (the SQL order-by clause is ignored by the main grid) | Same. The SQL clause is only used, as before, when there is no HQL clause (no tab in core does that) |
| Request | `_orderBy=<whole clause>` on every fetch | Same |
| Clause syntax | Several columns, `-column`, `column desc/DESC`, `e.` alias, paths, functions (`abs(debit) desc`), aliases of query-based tabs (`trx.movementDate`) | Same: the server parses the clause (`AdvancedQueryBuilder`, `HQLDataSourceService`) |
| Manual sort | `_sortBy=<user sorts>`, which takes precedence over `_orderBy` on the server | Same. `_orderBy` is still sent, as in classic |
| Sort indicator | None when the tab has an order-by clause | Shown on every column of the clause that maps to a grid field, in priority order and with its direction |
| No order-by clause | `OBViewGridComponent.getSortField` (see below) | Same field, from the backend `defaultSortField`; sent as `_sortBy` |
| Grouping | Grouped column first | Unchanged (`_sortBy`, see [grid grouping](../grid-grouping.md)) |
| Summaries | — | The summary request drops `_orderBy`, as it already dropped `sortBy` |

The [CSV export](../csv-export/README.md) reuses the grid query, so it carries the same `_orderBy` and
exports the rows in the same order.

## Tabs without an order-by clause

Classic `OBViewGridComponent.getSortField` picks, in this order:

1. the **last** view field, in sequence order, with a record sort number (`AD_Field.SortNo`), shown in the
   grid and shorter than 2000. Classic never updates its lowest sort number while looping, so the last
   qualifying field wins, not the lowest one (Product › Transactions sorts by Movement Date, sort number 2,
   not by Storage Bin, sort number 1);
2. the `sequenceNumber` property of the entity, otherwise its `lineNo` property, even when the tab has no
   field for it;
3. the first identifier field;
4. nothing (the server falls back to `id`).

The metadata module computes it with the same rules (`TabDefaultSort`) and emits it as the tab key
`defaultSortField` (`""` when the tab has an order-by clause or nothing applies). The client:

- sorts window grids by it (`resolveTabDefaultSorts`), ascending, as `_sortBy`;
- shows the indicator only when the property is a grid field (`getIndicatorSorts`); a property without a
  field (`sequenceNumber`) is only sent to the server;
- sorts Pick and Execute grids by it when the tab has no order-by clause and the user has not sorted
  (`resolveSortBy` in `WindowReferenceGrid`), before the existing `-documentNo` fallback;
- keeps the previous client rules (lowest sort number, identifier) only for metadata without the key.

Configurations stored before this change keep their stored sort until the user applies Standard view.

## Decisions

- **The clause travels untouched.** Translating it to `_sortBy` on the client loses what cannot be
  mapped to a field (expressions, nested paths, aliases of query-based tabs). Before this change only the
  first whitespace token was sent (`_sortBy=accountingSchema.name,`): secondary columns were lost and
  query-based tabs (e.g. *Average Cost Transactions*) failed with an invalid `ORDER BY`.
- **The clause is parsed only for the indicator.** It is split by top-level commas (so
  `coalesce(a, b)` is one token), each token reads its direction from a `-` prefix or an `asc`/`desc`
  suffix and drops the `e.` alias, and is matched to a field by property, column or field name. Tokens
  that do not map are skipped: the server still applies them.
- **Default vs manual sort.** The resolved sorts seed the grid sort state. While that state is empty or
  equal to the default sorts, the request carries only `_orderBy`. Any other sort is a manual sort and
  is sent as `_sortBy`.

## Differences with classic

- Classic hides a field whose server-evaluated display logic is false. `TabDefaultSort` does not evaluate it:
  no field with a record sort number uses that logic.
- The sort indicator is shown on the default sort columns of an order-by clause (classic shows none).
- Columns of the clause that do not map to a grid field (expressions, nested paths like
  `accountingSchema.name`, aliases of query-based tabs) have no indicator, although the server sorts by
  them.

## Known limitations

- A manual sort on several columns in a query-based tab is sent as a multi-column `_sortBy`, which the
  core `HQLDataSourceService` only resolves for a single property. This is pre-existing and not related
  to the default sort.

## Tests

- Unit (Jest): `utils/table/__tests__/defaultOrderBy.test.ts` (clause parsing, default sorts, default vs
  manual sort) and the default order-by block of `hooks/table/__tests__/useTableData.grouping.test.tsx`
  (request params, indicator seeding, summary request).
- E2E: probe GRDi (`playwright-tests/e2e/regression/10_Grid/GRDiDefaultSortOrderByTest.spec.ts`,
  `@regression`), see [Playwright E2E](../../testing/playwright-e2e/README.md#feature-probes). It asserts the
  request params, since the sample rows of a multi-column tab can already be in the same order by id.

## Main files

- `packages/MainUI/utils/table/defaultOrderBy.ts`: `ORDER_BY_PARAM`, `splitOrderByClause`,
  `parseOrderByToken`, `resolveOrderBySorts`, `resolveTabDefaultSorts`, `isDefaultSortingActive`.
- `packages/MainUI/hooks/table/useTableData.tsx`: `defaultSorts`, `applyOrderToOptions`, seeding of the
  sort indicator, summary request.
- `packages/MainUI/utils/table/grouping.ts`: `resolveEffectiveSorts`, `buildMultiSortBy`.
- `packages/MainUI/components/ProcessModal/WindowReferenceGrid.tsx`: `resolveSortBy` (Pick and Execute grids).
- `com.etendoerp.metadata`: `builders/TabDefaultSort.java` (`defaultSortField`), emitted by `TabBuilder`.
