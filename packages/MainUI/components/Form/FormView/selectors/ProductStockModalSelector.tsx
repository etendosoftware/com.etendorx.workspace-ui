import type { Field } from "@workspaceui/api-client/src/api/types";
import { SelectSelector } from "./SelectSelector";
import { useMemo } from "react";
import { DATASOURCE_REFERENCE_CODES, PRODUCT_STOCK_VIEW_REFERENCE_IDS } from "@/utils/form/constants";

const PRODUCT_SIMPLE_COLUMNS = [
  { accessorKey: "searchKey", header: "Search Key" },
  { accessorKey: "_identifier", header: "Product" },
  { accessorKey: "standardPrice", header: "Unit Price" },
  { accessorKey: "netListPrice", header: "List Price" },
  { accessorKey: "uOM", header: "UOM" },
];

const PRODUCT_STOCK_COLUMNS = [
  { accessorKey: "_identifier", header: "Product" },
  { accessorKey: "storageBin", header: "Storage Bin" },
  { accessorKey: "attributeSetValue", header: "Attribute Set Value" },
];

export const ProductStockModalSelector = ({
  field,
  isReadOnly,
}: {
  field: Field;
  isReadOnly: boolean;
}) => {
  const isStockView =
    field.selector?.datasourceName === "ProductStockView" ||
    (PRODUCT_STOCK_VIEW_REFERENCE_IDS as readonly string[]).includes(field.column?.referenceSearchKey);

  const effectiveField = useMemo(() => {
    const datasourceName = isStockView ? "ProductStockView" : field.selector?.datasourceName || "ProductSimple";
    return {
      ...field,
      selector: {
        ...field.selector,
        datasourceName,
        _selectorDefinitionId: field.selector?._selectorDefinitionId || DATASOURCE_REFERENCE_CODES.FALLBACK_SELECTOR_ID,
        ...(isStockView
          ? {
              skipWarehouseFilter: "true",
              valueField: (field.selector?.valueField as string) || "product.id",
              displayField: (field.selector?.displayField as string) || "_identifier",
            }
          : {
              valueField: (field.selector?.valueField as string) || "id",
              displayField: (field.selector?.displayField as string) || "_identifier",
            }),
      },
    };
  }, [field, isStockView]);

  const columns = isStockView ? PRODUCT_STOCK_COLUMNS : PRODUCT_SIMPLE_COLUMNS;

  return (
    <SelectSelector
      field={effectiveField}
      isReadOnly={isReadOnly}
      columns={columns}
      data-testid={`SelectSelector__${field.id}`}
    />
  );
};

export default ProductStockModalSelector;
