import type { Field } from "@workspaceui/api-client/src/api/types";
import { ModalSelector } from "./ModalSelector";
import { useTabContext } from "@/contexts/tab";
import { useMemo } from "react";

export const ProductStockModalSelector = ({
  field,
  isReadOnly,
}: {
  field: Field;
  isReadOnly: boolean;
}) => {
  const { parentTab } = useTabContext();

  const effectiveField = useMemo(() => {
    return {
      ...field,
      selector: {
        ...field.selector,
        skipWarehouseFilter: true,
      } as any,
    };
  }, [field]);

  const columns = [
    {
      accessorKey: "_identifier",
      header: "Product",
    },
    {
      accessorKey: "storageBin",
      header: "Storage Bin",
    },
    {
      accessorKey: "attributeSetValue",
      header: "Attribute Set Value",
    },
  ];

  return <ModalSelector field={effectiveField} isReadOnly={isReadOnly} customColumns={columns} />;
};

export default ProductStockModalSelector;
