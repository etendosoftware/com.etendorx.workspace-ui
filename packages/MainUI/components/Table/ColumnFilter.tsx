import type React from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import {
  ColumnFilterUtils,
  type ColumnFilterState,
  type FilterOption,
} from "@workspaceui/api-client/src/utils/column-filter-utils";
import { MultiSelect } from "../Form/FormView/selectors/components/MultiSelect";
import { useState } from "react";

export interface ColumnFilterProps {
  column: Column;
  filterState?: ColumnFilterState;
  onFilterChange: (selectedOptions: FilterOption[]) => void;
  onLoadOptions?: (searchQuery?: string) => void;
  onLoadMoreOptions?: (searchQuery?: string) => void;
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({
  column,
  filterState,
  onFilterChange,
  onLoadOptions,
  onLoadMoreOptions,
}) => {
  // Detectar columnas booleanas
  const isBooleanColumn = column.type === "boolean" || column.column?._identifier === "YesNo";

  // Forzar dropdown si es booleano
  const supportsDropdown = isBooleanColumn || ColumnFilterUtils.supportsDropdownFilter(column);

  if (!supportsDropdown) return null;

  // Opciones booleanas
  const booleanOptions: FilterOption[] = [
    { id: "true", label: "Sí", value: true },
    { id: "false", label: "No", value: false },
  ];

  // Usar booleanOptions si es booleano, sino opciones normales
  const availableOptions = isBooleanColumn
    ? booleanOptions
    : (filterState?.availableOptions || []).map((option) => ({
        id: option.id,
        label: option.label,
      }));

  // ----------------------------
  // Estado local para booleanos (para que se vea seleccionado)
  // ----------------------------
  const [localSelectedOptions, setLocalSelectedOptions] = useState<FilterOption[]>(filterState?.selectedOptions || []);

  // Valores seleccionados (coinciden con id de availableOptions)
  const selectedValues = isBooleanColumn
    ? localSelectedOptions.map((opt) => opt.id)
    : (filterState?.selectedOptions || []).map((option) => option.id);

  // Cambiar selección
  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedOptions = (availableOptions || []).filter((option) => selectedIds.includes(option.id));

    // Actualizar estado local para booleanos
    if (isBooleanColumn) {
      setLocalSelectedOptions(selectedOptions);
    }

    // Propagar hacia callback
    onFilterChange(selectedOptions);
  };

  // Buscar opciones (solo para no booleanos)
  const handleSearchChange = (searchQuery: string) => {
    if (onLoadOptions && !isBooleanColumn) onLoadOptions(searchQuery);
  };

  // Cargar más opciones (solo para TableDir y no booleanos)
  const handleLoadMore = () => {
    if (onLoadMoreOptions && ColumnFilterUtils.isTableDirColumn(column) && !isBooleanColumn) {
      onLoadMoreOptions(filterState?.searchQuery);
    }
  };

  // ----------------------------
  // Logs para depuración
  // ----------------------------
  console.log("[ColumnFilter] column:", column.columnName);
  console.log("[ColumnFilter] isBooleanColumn:", isBooleanColumn);
  console.log("[ColumnFilter] availableOptions:", availableOptions);
  console.log("[ColumnFilter] selectedValues:", selectedValues);
  console.log("[ColumnFilter] filterState:", filterState);

  return (
    <MultiSelect
      options={availableOptions}
      selectedValues={selectedValues}
      onSelectionChange={handleSelectionChange}
      onSearch={!isBooleanColumn ? handleSearchChange : undefined}
      onFocus={!isBooleanColumn ? onLoadOptions : undefined}
      onLoadMore={!isBooleanColumn ? handleLoadMore : undefined}
      loading={filterState?.loading || false}
      hasMore={filterState?.hasMore || false}
      placeholder={`Filter ${column.name || column.columnName}...`}
      maxHeight={200}
    />
  );
};
