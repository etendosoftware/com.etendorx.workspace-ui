# Property fields in the grid

A **property field** is an `AD_Field` whose `Property` is a DAL path through a related record
instead of a column of the tab's own table. Examples: `productCategory.name` in Product ›
Product Categories, or `paymentDetails.finPayment.paymentDate` in Sales Invoice › Payment Details.
Their grid columns show the value of the related record, as in Classic.

## Behavior

| Aspect | Result |
|--------|--------|
| Grid cell | The value at the end of the path. A path that ends in a reference (e.g. `paymentDetails.finPayment`) shows the identifier of the referenced record |
| Form view | Same value as the grid. The field is read-only, as in Classic |
| Sort | Allowed. The grid sorts by the path, and the server joins the related records |
| Column filter | Allowed. The filter criteria use the path, so the server resolves it the same way |
| CSV export | The column is exported with its values (the export reuses the grid request, see [CSV export](../csv-export/README.md)) |
| Save | The value is never written. The datasource ignores a key containing `$`, as Classic does |

Only paths with a `.` are property fields in this sense. A single-segment `Property` (e.g. `amount`)
is a property of the tab's own entity and behaves as a regular column.

## How it works

```mermaid
flowchart LR
  Meta[Metadata module: field named after its path, finPayment$paymentDate] --> Grid[useTableData]
  Grid -->|_extraProperties=finPayment.paymentDate| Proxy[/api/datasource]
  Proxy --> Classic[DataSourceServlet / DataToJsonConverter]
  Classic -->|row key finPayment$paymentDate and $_identifier| Cell[tableColumns accessor: row of hqlName]
```

1. **Name of the field.** The metadata module (`FieldBuilder.getHqlName`) names a property field
   after its path with `$` instead of `.` (`finPayment.paymentDate` becomes `finPayment$paymentDate`).
   The fields of the tab are keyed by that same name (`TabProcessor`).
2. **Request.** Every datasource fetch of a tab sends the paths of its property fields, in dot form,
   in `_extraProperties`, next to the color paths of colored references. `buildTabExtraProperties`
   builds the parameter for the grid fetch, the save response, the record refresh after a process or
   save, and the row refetch after an inline edit.
3. **Response.** Classic returns each value under the path with `$`, plus `<path>$_identifier` for
   references. That key is the `hqlName` of the field, so the cell accessor, the sort, the column
   filters, the CSV view state and the form read it with no special case.

## Decisions

- **Same name as Classic.** Classic names these fields `property.replace('.', '$')`
  (`OBViewFieldHandler.getName`). The module used the property of the field's column instead
  (`paymentDate`). The datasource never returns a value under that name, so the cells were empty.
  That name could also be the same as a property of the tab's own entity (`amount` in Payment Details):
  one field overwrote the other in the tab metadata, and the form could send the value under a
  property of the tab's own entity.
- **The client builds `_extraProperties`.** Classic adds the paths to the datasource definition of the
  view (`OBViewTab`). In the New UI the client builds every datasource request, so the paths come from
  the field metadata (`column.propertyPath`). The value is the same: every path with a `.`, in dot form.
- **One helper for every request.** The color paths were built in five places with the same code.
  `buildTabExtraProperties` replaces them, so the grid, the save response and the refreshes request
  the same values and a refresh does not leave a property cell empty again.

## Differences with Classic

None in behavior. The paths are sent by the client instead of the datasource definition.

## Configuration

None. A field becomes a property field when its `Property` is set in the Application Dictionary
(Windows, Tabs and Fields › Field › Property).

## Main files

- `com.etendoerp.metadata`: `builders/FieldBuilder.java` (`getPropertyFieldName`, `getHqlName`) and
  `data/TabProcessor.java` (field key).
- `packages/MainUI/utils/table/extraProperties.ts`: `getPropertyFieldPaths`, `buildTabExtraProperties`.
- `packages/MainUI/hooks/table/useTableData.tsx`: grid fetch.
- `packages/MainUI/utils/index.ts` (`buildQueryString`), `components/Form/FormView/index.tsx` and
  `components/Table/index.tsx`: save response and refreshes.
- `packages/MainUI/hooks/useCurrentRecord.ts`: the record fetch of the form, which already requested
  the paths.

## Related

- [CSV export](../csv-export/README.md): the export reuses the grid request.
- [Column filters](../column-filters/README.md): how column filters become criteria.
- [Saved views](../saved-views/README.md): a saved filter on a property column created before this
  change used the old name and no longer applies. It never filtered anything.
