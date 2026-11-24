# Product characteristics filter

Products can have characteristics, for example "Formato" with the values "330 ml", "500 ml" and "1 L". Values
can be grouped in a tree, for example a group "Botella" with "Vidrio" and "PET". The "Characteristic
Description" column (reference `C632F1CFF5A1453EB28BDF44A70478F8`) shows the characteristics of each product,
and its filter lets the user pick characteristic values to see only the products that have them.

This document covers the filter of that column, which follows Classic (`ob-formitem-characteristics.js` and
`ProductCharacteristicsDS`) since ETP-6330. How the field is shown in the product form is covered in
[Classic preferences](../classic-preferences/README.md) (`ShowProductCharacteristicsParents`).

## Behaviour

- **Tree.** The filter is a dropdown with a tree: each characteristic, with its values and groups. Every node has
  a checkbox, the characteristic included.
- **Groups.** Checking a group or a characteristic checks every value below it, inner groups included, and
  unchecking it clears them. A group or characteristic with only some values checked shows a partial checkbox.
  Clicking a row, or Enter on the highlighted row, toggles it like its checkbox. Only the values (the leaves)
  filter, as in Classic.
- **Order.** Characteristics, groups and values are sorted alphabetically, ignoring case, on each level, as the
  Classic tree sorts itself once its data arrives. The server returns them in the order of the tree.
- **Combination.** Values of the same characteristic are combined with OR, different characteristics with AND:
  "Certificación = Bio" and "Formato = 330 ml" shows the products that are Bio **and** 330 ml. The criterion is
  the Classic one: an `and` group marked `isProductCharacteristicsCriteria` with one `exists` criterion per
  characteristic (`LegacyColumnFilterUtils.buildExistsQueryCriteria`).
- **Values offered.** The tree is loaded again every time the dropdown opens:
  - In a window grid it sends `_parentDSIdentifier` (the grid entity), `_propertyPath` (the product of the row)
    and the criteria of the grid without the characteristics criterion, so it offers only the values of the
    records the grid can show with its other filters.
  - In a process grid (Pick and Execute) it sends `_processId` and `_buttonOwnerContextInfo` (the values of the
    record that launched the process). As in Classic, the tree is not limited by the grid records there, except
    in Manage Variants, whose server restriction offers only the variant characteristics of the product.
- **Search.** The search box of the dropdown filters the loaded tree locally, keeping the parents of each
  match. It is not sent to the server, whose datasource would read it as a filter of the grid.
- **Filter cell.** It shows the Classic text, `Formato:[330 ml], Certificación:[Bio - Vegano]`. A group that is
  fully checked and has no inner groups is shown by its name (`Envase:[Botella]`). The selection is read from the
  applied filter, so the text survives a remount or a restored view; until the tree is loaded again it lists the
  applied values. The clear button removes the filter.

## Where it applies

| Grid | Entity / field | Product path |
| --- | --- | --- |
| Product (header) | `Product.characteristicDescription` | `e` |
| Product > Products (Services Related Products) | `relatedProduct.characteristicDescription` | `e.relatedProduct` |
| Create Purchase Order Lines (process) | `CreatePOLinesPE`, `product.characteristicDescription` | `e.product` |
| Add Products (process) | `ProductWithCharacteristics.characteristicDescription` | `e.product` |
| Services Related Products (process) | `Product.characteristicDescription` | `e` |
| Manage Variants (process) | `ManageVariants.characteristicDescription` (datasource) | not used |

The product path replaces `{productInEntity}` in the Classic exists query
(`exists (from ProductCharacteristicValue v where {productInEntity} = v.product and v.characteristicValue.id in ($value))`)
and is sent as `_propertyPath`. It is resolved as in Classic `OBCharacteristicsFilterItem.init`
(`resolveProductPath`): the base entity `e` followed by the path of the field (`product$characteristicDescription`
gives `e.product`). In a process grid the query alias is always set (`e`, the alias of every core Pick and
Execute table), so a non-product entity adds `.product`. Manage Variants reads the selected ids from the
criterion itself (`ManageVariantsDS.readCriteria`) and ignores the query.

## Decisions

- **A dropdown instead of the Classic dialog.** Classic opens a window with OK, Clear and Cancel. The new UI keeps
  the dropdown of the column, like the rest of its column filters, and applies each change at once; the clear
  button replaces Clear, and closing the dropdown replaces Cancel. The rules of selection, order and
  combination are the Classic ones.
- **The tree is reloaded on every opening,** as Classic does, because the values offered depend on the other
  filters of the grid.
- **Only the characteristics column changes.** Other tree reference columns keep their behaviour (one value per
  click, characteristic nodes not selectable, server order); the Classic rules are enabled by the
  characteristics context the grids pass to the filter.
- **Alphabetical order ignoring case.** The Classic tree sorts by the node title on each level; the new UI
  compares the lower-case titles.

## Differences with Classic

- The filter is a dropdown applied on every change instead of a dialog with OK, Clear and Cancel.
- The search box of the dropdown does not exist in Classic.
- **Product selector search windows** (the magnifier of a product field): if a selector shows the
  "Characteristic Description" column, its filter is a text box in the new UI, while Classic shows the tree
  (`_selectorDefinition`). This is out of the scope of ETP-6330 and is left for a separate task.
- A Pick and Execute grid of a module whose HQL table has its own alias builds the exists query with `e`; Classic
  uses the alias of the table. No core process is affected.

## Main files

- `packages/MainUI/utils/table/characteristicsFilter.ts`: product path, exists query, tree parameters, cascading
  selection, filter cell text and the contexts of window and process grids.
- `packages/MainUI/components/Table/TreeColumnFilter.tsx`: the dropdown (characteristics mode when it gets a
  `characteristicsContext`).
- `packages/MainUI/components/Table/index.tsx` (`TreeColumnFilterWrapper`): window grids.
- `packages/MainUI/components/Table/ColumnFilter.tsx`, `hooks/table/useColumns.tsx`,
  `components/ProcessModal/WindowReferenceGrid.tsx`: process grids.
- `packages/MainUI/utils/form/treeUtils.ts` (`sortSiblings`): sorted tree levels.
- `packages/api-client/src/hooks/useColumnFilterData.ts` (`treeParams`, characteristic of each value) and
  `packages/api-client/src/utils/search-utils.ts` (`buildExistsQueryCriteria`): request and criterion.

## Related documentation

- [Column filters](../column-filters/README.md)
- [Classic preferences](../classic-preferences/README.md)
