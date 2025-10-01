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
import type { EntityData, EntityValue, Column, Tab } from "@workspaceui/api-client/src/api/types";
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
import type { GridSelectionStructure } from "./ProcessDefinitionModal";
import { useColumns } from "@/hooks/table/useColumns";
import { useGridColumnFilters } from "@/hooks/table/useGridColumnFilters";

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
  const [appliedTableFilters, setAppliedTableFilters] = useState<MRT_ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const [isDataReady, setIsDataReady] = useState(false);

  const lastDefaultsRef = useRef<string>("");
  const lastFilterExpressionsRef = useRef<string>("");
  const stableWindowReferenceTabRef = useRef<typeof windowReferenceTab | undefined>(windowReferenceTab);

  // Stabilize windowReferenceTab reference to prevent infinite re-renders
  if (windowReferenceTab && windowReferenceTab.id !== stableWindowReferenceTabRef.current?.id) {
    stableWindowReferenceTabRef.current = windowReferenceTab;
  }
  const stableWindowReferenceTab = stableWindowReferenceTabRef.current;

  const stableProcessDefaults = useMemo<Record<string, EntityValue>>(() => {
    const defaults = (processConfig?.defaults as unknown as Record<string, EntityValue>) || {};
    const defaultsString = JSON.stringify(defaults);

    if (defaultsString !== lastDefaultsRef.current) {
      lastDefaultsRef.current = defaultsString;
      return defaults;
    }

    return lastDefaultsRef.current ? JSON.parse(lastDefaultsRef.current) : {};
  }, [processConfig?.defaults]);

  const stableFilterExpressions = useMemo(() => {
    const filters = processConfig?.filterExpressions || {};
    const filtersString = JSON.stringify(filters);

    if (filtersString !== lastFilterExpressionsRef.current) {
      lastFilterExpressionsRef.current = filtersString;
      return filters;
    }

    return lastFilterExpressionsRef.current ? JSON.parse(lastFilterExpressionsRef.current) : {};
  }, [processConfig?.filterExpressions]);

  useEffect(() => {
    if (!processConfigLoading && processConfig) {
      const timer = setTimeout(() => {
        setIsDataReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [processConfigLoading, processConfig]);

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

    const applyDynamicKeys = () => {
      if (processId !== CREATE_LINES_FROM_ORDER_PROCESS_ID || !dynamicKeys) return;

      const { invoiceClient, invoiceBusinessPartner, invoicePriceList, invoiceCurrency } = dynamicKeys as Record<
        string,
        string
      >;

      options[invoiceClient] = recordValues?.inpadClientId || "";
      options[invoiceBusinessPartner] = recordValues?.inpcBpartnerId || "";
      options[invoicePriceList] = recordValues?.inpmPricelistId || "";
      options[invoiceCurrency] = recordValues?.inpcCurrencyId || "";
    };

    const applyStableProcessDefaults = () => {
      if (!stableProcessDefaults || Object.keys(stableProcessDefaults).length === 0) return;

      for (const [key, value] of Object.entries(stableProcessDefaults)) {
        const actualValue =
          typeof value === "object" && value !== null && "value" in value
            ? (value as { value: EntityValue }).value
            : (value as EntityValue);

        const matchingParameter = Object.values(parameters).find((param) => param.name === key);
        const datasourceFieldName = matchingParameter?.dBColumnName || key;

        options[datasourceFieldName] = actualValue;

        if (defaultKeys && key in defaultKeys) {
          const defaultKey = defaultKeys[key as keyof typeof defaultKeys];
          options[defaultKey] = actualValue;
        }
      }
    };

    const buildCriteria = (): Array<{ fieldName: string; operator: string; value: EntityValue }> => {
      if (!stableFilterExpressions?.grid) return [];

      return Object.entries(stableFilterExpressions.grid).map(([fieldName, value]) => {
        let parsedValue: EntityValue;

        if (value === "true") {
          parsedValue = true;
        } else if (value === "false") {
          parsedValue = false;
        } else {
          parsedValue = value as EntityValue;
        }

        return {
          fieldName,
          operator: "equals",
          value: parsedValue,
        };
      });
    };

    applyDynamicKeys();
    applyStableProcessDefaults();

    const criteria = buildCriteria();

    if (criteria.length > 0) {
      options.orderBy = "documentNo desc";
      // Keep criteria as array of objects, cast to EntityValue for type compatibility
      options.criteria = criteria as unknown as EntityValue;
    }

    return options;
  }, [
    processConfig?.processId,
    parameter.tab,
    tabId,
    stableProcessDefaults,
    stableFilterExpressions,
    recordValues?.inpadClientId,
    recordValues?.inpcBpartnerId,
    recordValues?.inpmPricelistId,
    recordValues?.inpcCurrencyId,
    parameters,
  ]);

  const fields = useMemo(() => {
    if (stableWindowReferenceTab?.fields) {
      return Object.values(stableWindowReferenceTab.fields);
    }
    return [];
  }, [stableWindowReferenceTab]);

  // Parse raw columns with fix for WindowReferenceGrid
  const rawColumns = useMemo(() => {
    if (fields.length > 0) {
      const { parseColumns } = require("@/utils/tableColumns");
      const parsed = parseColumns(fields);

      // Add filterFieldName to each column for backend filtering
      // This is needed because some processes have hqlName as display names
      const enriched = parsed.map((col: Column) => {
        const matchingField = fields.find((f) => f.name === col.header);

        // For filtering, we need to check if hqlName is a display name
        const isDisplayName =
          col.columnName.includes(" ") || col.columnName.includes(".") || /^[A-Z]/.test(col.columnName);

        // If hqlName is a display name, use the key from fields (camelCase property name)
        // Otherwise, use hqlName as-is
        const filterFieldName = isDisplayName
          ? matchingField?.column?._identifier ||
            (Object.keys(fields) as Array<keyof typeof fields>).find((k) => fields[k] === matchingField) ||
            col.columnName
          : col.columnName;

        return {
          ...col,
          filterFieldName, // This will be used for backend filtering
        };
      });

      return enriched;
    }
    return [];
  }, [fields]);

  // Column filters hook - needs stable columns reference
  const stableRawColumns = useMemo(() => rawColumns, [JSON.stringify(rawColumns.map((c: Column) => c.id))]);

  // Use grid column filters hook to avoid code duplication with useTableData
  const { advancedColumnFilters, handleColumnFilterChange, handleLoadFilterOptions, handleLoadMoreFilterOptions } =
    useGridColumnFilters({
      columns: stableRawColumns,
      tabId: tabId ? String(tabId) : undefined,
      entityName: entityName ? String(entityName) : undefined,
      setAppliedTableFilters,
      setColumnFilters,
    });

  // Create a minimal tab object for useColumns with corrected field hqlNames
  const mockTab = useMemo(() => {
    if (!stableWindowReferenceTab?.fields) {
      return {
        id: tabId,
        fields: {},
      } as Tab;
    }

    // Fix hqlName ONLY if it's a display name (contains spaces or starts with uppercase)
    // Some processes have correct hqlName (camelCase like 'organization')
    // Others have incorrect hqlName (display name like 'Organization' or 'Order No.')
    const correctedFields = Object.fromEntries(
      Object.entries(stableWindowReferenceTab.fields).map(([key, field]) => {
        // Check if hqlName looks like a display name (has spaces, starts with uppercase, etc)
        const isDisplayName =
          field.hqlName.includes(" ") || field.hqlName.includes(".") || /^[A-Z]/.test(field.hqlName);

        // Only correct if it's a display name, otherwise keep original
        const actualColumnName = isDisplayName ? field.column?._identifier || key || field.hqlName : field.hqlName;

        return [
          key,
          {
            ...field,
            hqlName: actualColumnName,
          },
        ];
      })
    );

    return {
      ...stableWindowReferenceTab,
      id: stableWindowReferenceTab.id || tabId,
      fields: correctedFields,
    } as Tab;
  }, [stableWindowReferenceTab, tabId]);

  // Get columns with filter handlers using useColumns
  // Pass options as stable reference to avoid re-creating columns unnecessarily
  const columnOptions = useMemo(
    () => ({
      onColumnFilter: handleColumnFilterChange,
      onLoadFilterOptions: handleLoadFilterOptions,
      onLoadMoreFilterOptions: handleLoadMoreFilterOptions,
      columnFilterStates: advancedColumnFilters,
    }),
    [handleColumnFilterChange, handleLoadFilterOptions, handleLoadMoreFilterOptions, advancedColumnFilters]
  );

  const columnsFromHook = useColumns(mockTab, columnOptions);

  const columns = useMemo(() => {
    const finalColumns = columnsFromHook.length > 0 ? columnsFromHook : rawColumns;

    // DON'T change column IDs - they need to match the data keys from datasource
    // The accessorFn in parseColumns already handles data mapping using hqlName

    // Merge filterFieldName from rawColumns into finalColumns
    const columnsWithFilterFieldName = finalColumns.map((col: Column) => {
      const rawCol = rawColumns.find((r: Column) => r.header === col.header);
      return {
        ...col,
        filterFieldName: (rawCol as any)?.filterFieldName || col.columnName,
      };
    });

    // Ensure all columns have filtering enabled (either dropdown or text)
    const columnsWithFilters = columnsWithFilterFieldName.map((col: Column) => {
      // If column already has a Filter component (dropdown), keep it
      if (col.Filter) {
        return col;
      }

      // Otherwise, enable simple text filtering for this column
      return {
        ...col,
        enableColumnFilter: true,
        columnFilterModeOptions: ["contains", "startsWith", "endsWith"],
        filterFn: "contains",
      };
    });

    return columnsWithFilters;
  }, [columnsFromHook, rawColumns]);

  const shouldSkipFetch = !isDataReady || processConfigLoading || !entityName;

  const {
    records: rawRecords,
    loading: datasourceLoading,
    error: datasourceError,
    refetch,
    hasMoreRecords,
    fetchMore,
  } = useDatasource({
    entity: String(entityName),
    params: datasourceOptions,
    columns: rawColumns,
    activeColumnFilters: appliedTableFilters,
    skip: shouldSkipFetch,
  });

  // Stabilize records reference using JSON comparison to prevent unnecessary re-renders
  const recordsStringRef = useRef<string>("");
  const stableRecordsRef = useRef<EntityData[]>([]);

  const records = useMemo(() => {
    const recordsString = JSON.stringify(rawRecords || []);
    if (recordsString !== recordsStringRef.current) {
      recordsStringRef.current = recordsString;
      stableRecordsRef.current = rawRecords || [];
    }
    return stableRecordsRef.current;
  }, [rawRecords]);

  useEffect(() => {
    if (!records) return;

    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        _selection: [],
        _allRows: [],
      },
    }));
  }, [records, onSelectionChange, parameter.dBColumnName]);

  // Reset selection and filters on mount or when entity changes
  useEffect(() => {
    setRowSelection({});
    setColumnFilters([]);
    setAppliedTableFilters([]);
    // Call onSelectionChange with the structure for this entityName
    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        _selection: [],
        _allRows: [],
      },
    }));
  }, [onSelectionChange, entityName, parameter.dBColumnName]);

  const handleMRTColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      const newColumnFilters = typeof updaterOrValue === "function" ? updaterOrValue(columnFilters) : updaterOrValue;
      setColumnFilters(newColumnFilters);
      setAppliedTableFilters(newColumnFilters);
    },
    [columnFilters]
  );

  const handleRowSelection = useCallback(
    (updaterOrValue: MRT_RowSelectionState | ((prev: MRT_RowSelectionState) => MRT_RowSelectionState)) => {
      const newSelection = typeof updaterOrValue === "function" ? updaterOrValue(rowSelection) : updaterOrValue;

      setRowSelection(newSelection);

      const selectedItems = records.filter((record) => {
        const recordId = String(record.id);
        return newSelection[recordId];
      });

      // Update with the new structure
      onSelectionChange((prev: GridSelectionStructure) => ({
        ...prev,
        [parameter.dBColumnName]: {
          _selection: selectedItems,
          _allRows: records,
        },
      }));
    },
    [rowSelection, records, onSelectionChange, parameter.dBColumnName]
  );

  const handleClearSelections = useCallback(() => {
    setRowSelection({});
    // Clear selections for this entityName
    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        _selection: [],
        _allRows: records,
      },
    }));
  }, [onSelectionChange, parameter.dBColumnName, records]);

  const handleRowClick = useCallback(
    (row: MRT_Row<EntityData>) => {
      setRowSelection((prev) => {
        const newSelection = { ...prev };
        newSelection[row.id] = !newSelection[row.id];

        const selectedItems = records.filter((record) => {
          const recordId = String(record.id);
          return newSelection[recordId];
        });

        // Update with the new structure
        onSelectionChange((prev: GridSelectionStructure) => ({
          ...prev,
          [parameter.dBColumnName]: {
            _selection: selectedItems,
            _allRows: records,
          },
        }));

        return newSelection;
      });
    },
    [records, onSelectionChange, parameter.dBColumnName]
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

  const tableOptions: MRT_TableOptions<EntityData> = useMemo(
    () => ({
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
      data: records || [],
      getRowId: (row) => String(row.id),
      renderTopToolbar,
      renderBottomToolbar: hasMoreRecords
        ? () => <LoadMoreButton fetchMore={fetchMore} data-testid="LoadMoreButton__ce8544" />
        : undefined,
      renderEmptyRowsFallback: () => (
        <div className="flex justify-center items-center p-8 text-gray-500">
          <EmptyState maxWidth={MAX_WIDTH} data-testid="EmptyState__ce8544" />
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
      onColumnFiltersChange: handleMRTColumnFiltersChange,
    }),
    [
      columns,
      records,
      rowSelection,
      columnFilters,
      hasMoreRecords,
      renderTopToolbar,
      fetchMore,
      handleRowSelection,
      handleMRTColumnFiltersChange,
      handleRowClick,
    ]
  );

  const table = useMaterialReactTable(tableOptions);

  // Separate initial loading from filter/refresh loading
  // Only show loading spinner on initial load, not on filter changes
  const isInitialLoading = (tabLoading || processConfigLoading || !isDataReady) && !records;
  const error = tabError || processConfigError || datasourceError;

  if (isInitialLoading) {
    return (
      <div className="p-4 flex justify-center">
        <Loading data-testid="Loading__ce8544" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title={t("errors.missingData")}
        description={error?.message}
        showRetry
        onRetry={refetch}
        data-testid="ErrorDisplay__ce8544"
      />
    );
  }

  // Only show EmptyState if there are no fields (configuration error)
  // If there are fields but no records, show the table with empty state inside
  // This allows users to clear filters even when no results are found
  if (fields.length === 0 && !tabLoading) {
    return <EmptyState maxWidth={MAX_WIDTH} data-testid="EmptyState__ce8544" />;
  }

  return (
    <div
      className={`flex flex-col w-full overflow-hidden max-h-4xl h-full transition duration-100 ${
        datasourceLoading ? "opacity-40 cursor-wait cursor-to-children" : "opacity-100"
      }`}
      ref={contentRef}>
      <MaterialReactTable table={table} data-testid="MaterialReactTable__ce8544" />
    </div>
  );
}

export default WindowReferenceGrid;
