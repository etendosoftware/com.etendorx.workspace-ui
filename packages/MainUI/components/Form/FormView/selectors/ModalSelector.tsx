import { useState, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import SearchIcon from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";
import type { Field, EntityData } from "@workspaceui/api-client/src/api/types";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import { TextInput } from "./components/TextInput";
import type { ChangeEvent } from "react";

export const ModalSelector = ({
  field,
  isReadOnly,
  customColumns,
}: {
  field: Field;
  isReadOnly: boolean;
  customColumns?: any[];
}) => {
  const { watch, setValue, getValues } = useFormContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const valueField = (field.selector?.valueField as string) || "id";
  const displayField = (field.selector?.displayField as string) || "_identifier";

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

  const {
    records,
    loading,
    refetch,
    search,
    columns: backendColumns,
  } = useTableDirDatasource({
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
      const recordData = record as Record<string, unknown>;
      const realId = (recordData[valueField] || record.id) as string;
      const displayValue = (recordData[displayField] || record._identifier) as string;

      setValue(field.hqlName, realId);
      setValue(`${field.hqlName}$_identifier`, displayValue);
      setValue(`${field.hqlName}_data`, record);

      const formValues = getValues();
      for (const [key, val] of Object.entries(recordData)) {
        if (key === "id" || key === displayField || key === valueField) continue;
        if (key.endsWith("$_identifier") || key.startsWith("_")) continue;
        if (val === undefined || val === null) continue;

        if (key in formValues) {
          setValue(key, val);
          const identifierKey = `${key}$_identifier`;
          if (recordData[identifierKey]) {
            setValue(identifierKey, recordData[identifierKey]);
          }
        }
      }

      setIsModalOpen(false);
      setIsFocused(false);
    },
    [field.hqlName, setValue, getValues, valueField, displayField]
  );

  const columns = useMemo(() => {
    if (customColumns && customColumns.length > 0) {
      return customColumns.map((col) => ({
        ...col,
        Cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
          const val = row.original[col.accessorKey];
          // Try to find identifier key, checking multiple patterns if needed
          const ident = row.original[`${col.accessorKey}$_identifier`];
          return (ident || val || "-") as string;
        },
      }));
    }

    if (backendColumns && backendColumns.length > 0) {
      return backendColumns
        .filter((col: Record<string, unknown>) => col.isDisplayed !== false)
        .map((col: Record<string, unknown>) => ({
          accessorKey: col.name as string,
          header: (col.title || col.label || col.name) as string,
          Cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
            const colName = col.name as string;
            const val = row.original[colName];
            const ident = row.original[`${colName}$_identifier`];
            return (ident || val || "-") as string;
          },
        }));
    }

    const sampleKeys = records.length > 0 ? Object.keys(records[0]) : [];
    const selectedProperties =
      (field.selector?._selectedProperties as string)
        ?.split(",")
        .map((f) => f.trim())
        .filter((f) => f && f !== "id") || [];

    const addedKeys = new Set<string>();
    const columnDefs: { accessorKey: string; header: string }[] = [];

    const formatHeader = (key: string) =>
      key
        .replaceAll("$", " ")
        .replaceAll(/([A-Z])/g, " $1")
        .trim();

    const addColumn = (key: string, headerOverride?: string) => {
      if (addedKeys.has(key)) return;
      if (sampleKeys.length > 0 && !sampleKeys.includes(key)) return;
      addedKeys.add(key);
      columnDefs.push({ accessorKey: key, header: headerOverride || formatHeader(key) });
    };

    // 1. Display field first (product name / identifier)
    if (displayField && displayField !== "id") {
      addColumn(displayField, field.name || "Name");
    }

    // 2. FK fields from _selectedProperties (those with $_identifier in the data)
    for (const prop of selectedProperties) {
      if (sampleKeys.includes(`${prop}$_identifier`)) {
        addColumn(prop);
      }
    }

    if (columnDefs.length === 0) {
      return [{ accessorKey: displayField, header: field.name }];
    }

    return columnDefs.map((col) => ({
      ...col,
      Cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
        const val = row.original[col.accessorKey];
        const ident = row.original[`${col.accessorKey}$_identifier`];
        return (ident || val || "-") as string;
      },
    }));
  }, [backendColumns, records, displayField, field.name, field.selector?._selectedProperties, customColumns]);

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

  const fieldLabel = field.name || field.hqlName;

  return (
    <>
      <div className="w-full" data-testid={`ModalSelector__${field.id}`}>
        <button
          type="button"
          className={containerClassNames}
          onClick={handleOpenModal}
          onFocus={() => !isReadOnly && setIsFocused(true)}
          onBlur={() => !isReadOnly && setIsFocused(false)}
          disabled={isReadOnly}
          aria-label={`Select ${fieldLabel}`}>
          <span className={textClassNames}>
            {identifier || (typeof value === "string" ? value : value?._identifier) || `Select ${fieldLabel}...`}
          </span>
          <div className="flex items-center flex-shrink-0 ml-2">
            <SearchIcon fill="currentColor" className="w-5 h-5" />
          </div>
        </button>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={handleCloseModal}
        tittleHeader={`Select ${fieldLabel}`}
        descriptionText={`Choose a record for ${fieldLabel}.`}
        HeaderIcon={SearchIcon}
        showHeader
        buttons={
          <Button
            variant="outlined"
            onClick={handleCloseModal}
            className="w-auto px-6"
            data-testid={`ModalSelector__cancel__${field.id}`}>
            Cancel
          </Button>
        }
        data-testid={`ModalSelector__modal__${field.id}`}>
        <div className="flex flex-col gap-4 p-4 overflow-hidden" style={{ maxHeight: "70vh" }}>
          <div className="overflow-auto flex-1 border rounded" data-testid={`ModalSelector__table__${field.id}`}>
            <MaterialReactTable table={table} />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ModalSelector;
