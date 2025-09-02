/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useTab } from "@/hooks/useTab";
import { useTranslation } from "@/hooks/useTranslation";
import { parseColumns } from "@/utils/tableColumns";
import type { EntityData, EntityValue } from "@workspaceui/api-client/src/api/types";
import {
  type MRT_ColumnFiltersState,
  type MRT_Row,
  type MRT_RowSelectionState,
  type MRT_TableOptions,
  type MRT_TopToolbarProps,
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorDisplay } from "../ErrorDisplay";
import EmptyState from "../Table/EmptyState";
import Loading from "../loading";
import { useDatasource } from "@/hooks/useDatasource";
import { tableStyles } from "./styles";
import type { WindowReferenceGridProps } from "./types";
import { PROCESS_DEFINITION_DATA, CREATE_LINES_FROM_ORDER_PROCESS_ID } from "@/utils/processes/definition/constants";

const MAX_WIDTH = 100;
const PAGE_SIZE = 100;

/**
 * WindowReferenceGrid Component
 * Displays a grid of referenced records that can be selected
 */
function WindowReferenceGrid({
  parameter,
  parameters,
  onSelectionChange,
  tabId,
  entityName,
  windowReferenceTab,
  processConfig,
  processConfigLoading,
  processConfigError,
  recordValues,
}: WindowReferenceGridProps) {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const { loading: tabLoading, error: tabError } = useTab(windowReferenceTab?.id);

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  // Stable values to avoid unnecessary re-renders
  const processId = processConfig?.processId;
  const processDefaults = processConfig?.defaults;
  const filterExpressions = processConfig?.filterExpressions;

  const datasourceOptions = useMemo(() => {
    const processId = processConfig?.processId;
    const currentOptionData = PROCESS_DEFINITION_DATA[processId as keyof typeof PROCESS_DEFINITION_DATA];
    const defaultKeys = currentOptionData?.defaultKeys;
    const dynamicKeys = currentOptionData?.dynamicKeys;
    const staticOptions = currentOptionData?.staticOptions;

    const options: Record<string, EntityValue> = {
      ...staticOptions,
      tabId: parameter.tab || tabId,
      pageSize: PAGE_SIZE,
    };

    if (processId === CREATE_LINES_FROM_ORDER_PROCESS_ID && dynamicKeys) {
      const { invoiceClient, invoiceBusinessPartner, invoicePriceList, invoiceCurrency } = dynamicKeys as Record<
        string,
        string
      >;
      options[invoiceClient] = recordValues?.inpadClientId || "";
      options[invoiceBusinessPartner] = recordValues?.inpcBpartnerId || "";
      options[invoicePriceList] = recordValues?.inpmPricelistId || "";
      options[invoiceCurrency] = recordValues?.inpcCurrencyId || "";
    }

    console.debug("WindowReferenceGrid processConfig:", processConfig);
    console.debug("WindowReferenceGrid processConfig.defaults:", processDefaults);

    if (processDefaults) {
      for (const [key, value] of Object.entries(processDefaults)) {
        console.debug(`WindowReferenceGrid processing default: ${key} =`, value);

        // Handle different value structures
        const actualValue = typeof value === "object" && value !== null && "value" in value ? value.value : value;

        // Find the corresponding parameter by name to get its dBColumnName
        const matchingParameter = Object.values(parameters).find((param) => param.name === key);
        const datasourceFieldName = matchingParameter?.dBColumnName || key;

        // Set the value using the datasource field name (e.g., ad_org_id instead of Legal Entity Organization)
        options[datasourceFieldName] = actualValue;
        console.debug(`WindowReferenceGrid mapped ${key} to ${datasourceFieldName}:`, actualValue);

        // Also handle defaultKeys mapping if provided
        if (defaultKeys && key in defaultKeys) {
          const defaultKey = defaultKeys[key as keyof typeof defaultKeys];
          options[defaultKey] = actualValue;
          console.debug(`WindowReferenceGrid mapped ${key} to ${defaultKey} via defaultKeys:`, actualValue);
        }
      }
    }

    let criteria: Array<{ fieldName: string; operator: string; value: EntityValue }> = [];

    if (filterExpressions?.grid) {
      const filterCriteria = Object.entries(filterExpressions.grid).map(([fieldName, value]) => ({
        fieldName,
        operator: "equals",
        value: value === "true" ? true : value === "false" ? false : value,
      }));

      criteria = [...criteria, ...filterCriteria];
    }

    if (criteria.length > 0) {
      options.orderBy = "documentNo desc";
    }

    console.debug("WindowReferenceGrid final options:", options);

    return options;
  }, [tabId, parameter.tab, processId, processDefaults, filterExpressions, recordValues]);

  const fields = useMemo(() => {
    if (windowReferenceTab?.fields) {
      return Object.values(windowReferenceTab.fields);
    }
    return [];
  }, [windowReferenceTab]);

  const columns = useMemo(() => {
    if (fields.length > 0) {
      return parseColumns(fields, t);
    }
    return [];
  }, [fields, t]);

  const {
    records,
    loading: datasourceLoading,
    error: datasourceError,
    refetch,
    hasMoreRecords,
    fetchMore,
  } = useDatasource({
    entity: String(entityName),
    params: datasourceOptions,
    activeColumnFilters: columnFilters,
  });

  useEffect(() => {
    setRowSelection({});
    onSelectionChange([]);
  }, [onSelectionChange]);

  const handleRowSelection = useCallback(
    (updaterOrValue: MRT_RowSelectionState | ((prev: MRT_RowSelectionState) => MRT_RowSelectionState)) => {
      const newSelection = typeof updaterOrValue === "function" ? updaterOrValue(rowSelection) : updaterOrValue;

      setRowSelection(newSelection);

      const selectedItems = records.filter((record) => {
        const recordId = String(record.id);
        return newSelection[recordId];
      });

      onSelectionChange(selectedItems);
    },
    [records, onSelectionChange, rowSelection]
  );

  const handleColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      const newColumnFilters = typeof updaterOrValue === "function" ? updaterOrValue(columnFilters) : updaterOrValue;
      setColumnFilters(newColumnFilters);
    },
    [columnFilters]
  );

  const handleClearSelections = useCallback(() => {
    setRowSelection({});
    onSelectionChange([]);
  }, [onSelectionChange]);

  const handleRowClick = useCallback(
    (row: MRT_Row<EntityData>) => {
      setRowSelection((prev) => {
        const newSelection = { ...prev };
        newSelection[row.id] = !newSelection[row.id];

        const selectedItems = records.filter((record) => {
          const recordId = String(record.id);
          return newSelection[recordId];
        });

        onSelectionChange(selectedItems);
        return newSelection;
      });
    },
    [records, onSelectionChange]
  );

  const renderTopToolbar = useCallback(
    (props: MRT_TopToolbarProps<EntityData>) => {
      const selectedCount = props.table.getSelectedRowModel().rows.length;
      return (
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b max-h-[2.5rem]">
          <div className="text-base font-medium text-gray-800">{parameter.name}</div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedCount} {t("table.selection.multiple")}
              </span>
              <button
                type="button"
                onClick={handleClearSelections}
                className="px-3 py-1 text-sm cursor-pointer text-gray-700 border border-gray-300 rounded-full hover:bg-(--color-etendo-main) hover:text-(--color-baseline-0) transition-colors">
                {t("common.clear")}
              </button>
            </div>
          )}
        </div>
      );
    },
    [parameter.name, t, handleClearSelections]
  );

  const LoadMoreButton = ({ fetchMore }: { fetchMore: () => void }) => (
    <div className="flex justify-center p-2 border-t border-gray-200">
      <button
        type="button"
        onClick={fetchMore}
        className="px-4 py-2 text-sm border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100 transition-colors">
        {t("common.loadMore")}
      </button>
    </div>
  );

  const tableOptions: MRT_TableOptions<EntityData> = {
    muiTablePaperProps: {
      className: tableStyles.paper,
      style: {
        borderRadius: "1rem",
        boxShadow: "none",
      },
    },
    muiTableHeadCellProps: {
      className: tableStyles.headCell,
    },
    muiTableBodyCellProps: {
      className: tableStyles.bodyCell,
    },
    muiTableBodyProps: {
      className: tableStyles.body,
    },
    muiTableBodyRowProps: ({ row }) => {
      return {
        onClick: () => handleRowClick(row),
        className: rowSelection[row.id]
          ? "bg-blue-50 hover:bg-blue-100 cursor-pointer"
          : "hover:bg-gray-50 cursor-pointer",
      };
    },
    muiTableContainerProps: {
      className: tableStyles.container,
    },
    layoutMode: "semantic",
    enableColumnResizing: true,
    enableGlobalFilter: false,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    positionToolbarAlertBanner: "none",
    enablePagination: false,
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableColumnFilters: true,
    enableSorting: true,
    enableColumnActions: true,
    manualFiltering: true,
    columns,
    data: records,
    getRowId: (row) => String(row.id),
    renderTopToolbar,
    renderBottomToolbar: hasMoreRecords ? () => <LoadMoreButton fetchMore={fetchMore} /> : undefined,
    renderEmptyRowsFallback: () => (
      <div className="flex justify-center items-center p-8 text-gray-500">
        <EmptyState maxWidth={MAX_WIDTH} />
      </div>
    ),
    initialState: {
      density: "compact",
    },
    state: {
      rowSelection,
      columnFilters,
      showColumnFilters: true,
    },
    onRowSelectionChange: handleRowSelection,
    onColumnFiltersChange: handleColumnFiltersChange,
  };
  const table = useMaterialReactTable(tableOptions);
  const isLoading = tabLoading || processConfigLoading || datasourceLoading;
  const error = tabError || processConfigError || datasourceError;

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay title={t("errors.missingData")} description={error?.message} showRetry onRetry={refetch} />;
  }

  if ((fields.length === 0 && !tabLoading) || !records || records.length === 0) {
    return <EmptyState maxWidth={MAX_WIDTH} />;
  }

  return (
    <div
      className={`flex flex-col w-full overflow-hidden max-h-4xl h-full transition duration-100 ${
        datasourceLoading ? "opacity-40 cursor-wait cursor-to-children" : "opacity-100"
      }`}
      ref={contentRef}>
      <MaterialReactTable table={table} />
    </div>
  );
}

export default WindowReferenceGrid;
