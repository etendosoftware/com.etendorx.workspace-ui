import { useState, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import ProductIcon from "@workspaceui/componentlibrary/src/assets/icons/package.svg";
import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";
import type { Field, EntityData } from "@workspaceui/api-client/src/api/types";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import { TextInput } from "./components/TextInput";
import type { ChangeEvent } from "react";

export const ProductStockModalSelector = ({
  field,
  isReadOnly,
}: {
  field: Field;
  isReadOnly: boolean;
}) => {
  const { watch, setValue } = useFormContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const value = watch(field.hqlName);
  const identifier = watch(`${field.hqlName}$_identifier`);

  const containerClassNames = useMemo(() => {
    const baseClasses =
      "w-full flex items-center justify-between px-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 transition-colors outline-none";
    if (isReadOnly) {
      return `${baseClasses} bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) focus:bg-transparent`;
    }
    const activeStateClasses = "border-[#004ACA] text-[#004ACA] bg-[#E5EFFF]";
    const hoverStateClasses =
      "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)";
    const focusStateClasses =
      "focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none cursor-pointer";
    const interactiveStateClasses = isFocused || isModalOpen ? activeStateClasses : hoverStateClasses;
    return `${baseClasses} bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 ${interactiveStateClasses} ${focusStateClasses}`;
  }, [isReadOnly, isFocused, isModalOpen]);

  const textClassNames = useMemo(() => {
    const baseClasses = "text-sm truncate max-w-[calc(100%-40px)] font-medium";
    if (!identifier && !value) {
      return `${baseClasses} text-baseline-60`;
    }
    const isActiveState = (isFocused || isModalOpen) && !isReadOnly;
    const textColorClass = isActiveState ? "text-[#004ACA]" : "text-(--color-transparent-neutral-80)";
    return `${baseClasses} ${textColorClass}`;
  }, [identifier, value, isFocused, isModalOpen, isReadOnly]);

  const { records, loading, refetch, search, columns: backendColumns } = useTableDirDatasource({
    field,
    pageSize: 50,
  });

  const handleOpenModal = useCallback(() => {
    if (isReadOnly) return;
    setIsModalOpen(true);
    setIsFocused(true);
    refetch();
  }, [isReadOnly, refetch]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setIsFocused(false);
  }, []);

  const handleSelectRow = useCallback(
    (record: EntityData) => {
      // Use the real product ID, not the composite ProductStockView ID
      const productId = ((record as Record<string, unknown>).product$id || record.id) as string;
      setValue(field.hqlName, productId);
      setValue(`${field.hqlName}$_identifier`, record._identifier);
      setValue(`${field.hqlName}_data`, record);

      // Automated Dimension Injection
      if (record.storageBin) {
        const binId = record.storageBin as string;
        const binLabel = (record.storageBin$_identifier as string) || "";
        setValue("storageBin", binId);
        setValue("storageBin$_identifier", binLabel);
        setValue("mLocatorId", binId);
        setValue("mLocatorId$_identifier", binLabel);
      }

      const asiId = record.attributeSetValue;
      if (asiId && asiId !== "0") {
        const asiLabel = (record.attributeSetValue$_identifier as string) || "";
        setValue("attributeSetValue", asiId);
        setValue("attributeSetValue$_identifier", asiLabel);
        setValue("mAttributeSetInstanceId", asiId);
        setValue("mAttributeSetInstanceId$_identifier", asiLabel);
      } else {
        setValue("attributeSetValue", null);
        setValue("attributeSetValue$_identifier", "");
        setValue("mAttributeSetInstanceId", null);
        setValue("mAttributeSetInstanceId$_identifier", "");
      }

      setIsModalOpen(false);
      setIsFocused(false);
    },
    [field.hqlName, setValue]
  );

  const columns = useMemo(() => {
    if (backendColumns && backendColumns.length > 0) {
      return backendColumns
        .filter((col: any) => col.isDisplayed !== false)
        .map((col: any) => ({
          accessorKey: col.name,
          header: col.title || col.label || col.name,
          Cell: ({ row }: any) => {
            const val = row.original[col.name];
            const identifier = row.original[`${col.name}$_identifier`];
            return identifier || val || "-";
          },
        }));
    }

    return [
      {
        accessorKey: "_identifier",
        header: "Product",
      },
      {
        accessorKey: "storageBin$_identifier",
        header: "Storage Bin",
        Cell: ({ row }: any) => row.original.storageBin$_identifier || "-",
      },
      {
        accessorKey: "attributeSetValue$_identifier",
        header: "Attribute Set Value",
        Cell: ({ row }: any) => row.original.attributeSetValue$_identifier || "-",
      },
    ];
  }, [backendColumns]);

  const table = useMaterialReactTable({
    columns,
    data: records,
    state: {
      isLoading: loading,
      showProgressBars: loading,
    },
    enablePagination: false,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleSelectRow(row.original),
      sx: { cursor: "pointer" },
    }),
  });

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    search(val);
  };

  return (
    <>
      <div className="w-full">
        <div
          className={containerClassNames}
          onClick={handleOpenModal}
          onFocus={() => !isReadOnly && setIsFocused(true)}
          onBlur={() => !isReadOnly && setIsFocused(false)}
          tabIndex={isReadOnly ? -1 : 0}>
          <span className={textClassNames}>
            {identifier || (typeof value === "string" ? value : value?._identifier) || "Select a Product..."}
          </span>
          <div className="flex items-center flex-shrink-0 ml-2">
            <ProductIcon
              fill="currentColor"
              className={`w-5 h-5 transition-colors ${
                (isFocused || isModalOpen) && !isReadOnly ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)"
              }`}
            />
          </div>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={handleCloseModal}
        tittleHeader="Select Product Stock"
        descriptionText="Choose a product with its corresponding storage bin and attribute set value."
        HeaderIcon={ProductIcon}
        showHeader
        buttons={
          <Button variant="outlined" onClick={handleCloseModal} className="w-auto px-6">
            Cancel
          </Button>
        }>
        <div className="flex flex-col gap-4 p-4 overflow-hidden" style={{ maxHeight: "70vh" }}>
          <TextInput
            placeholder="Search by product name or key..."
            value={localSearch}
            onChange={handleSearchChange}
            field={field}
          />
          <div className="overflow-auto flex-1 border rounded">
            <MaterialReactTable table={table} />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductStockModalSelector;
