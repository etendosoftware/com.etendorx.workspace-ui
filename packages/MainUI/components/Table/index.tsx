import {
  MaterialReactTable,
  type MRT_ColumnFiltersState,
  type MRT_Row,
  useMaterialReactTable,
  type MRT_TableBodyRowProps,
  type MRT_TableInstance,
} from "material-react-table";
import { useStyle } from "./styles";
import type { DatasourceOptions, EntityData } from "@workspaceui/etendohookbinder/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "../../contexts/searchContext";
import { useDatasourceContext } from "@/contexts/datasourceContext";
import EmptyState from "./EmptyState";
import { parseColumns } from "@/utils/tableColumns";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useLanguage } from "@/contexts/language";
import useTableSelection from "@/hooks/useTableSelection";
import { ErrorDisplay } from "../ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import { useTabContext } from "@/contexts/tab";
import { useDatasource } from "@/hooks/useDatasource";
import { useSelected } from "@/hooks/useSelected";

type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<EntityData>;
  table: MRT_TableInstance<EntityData>;
}) => Omit<MRT_TableBodyRowProps<EntityData>, "staticRowIndex">;

const getRowId = (row: EntityData) => String(row.id);
interface DynamicTableProps {
  setRecordId: React.Dispatch<React.SetStateAction<string>>;
  onRecordSelection?: (recordId: string) => void;
}

const DynamicTable = ({ setRecordId, onRecordSelection }: DynamicTableProps) => {
  const { sx } = useStyle();
  const { searchQuery } = useSearch();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const { graph } = useSelected();
  const { registerDatasource, unregisterDatasource, registerRefetchFunction } = useDatasourceContext();
  const { registerActions } = useToolbarContext();
  const { tab, parentTab, parentRecord } = useTabContext();
  const tabId = tab.id;
  const parentId = String(parentRecord?.id ?? "");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  console.log(`[DynamicTable ${tabId}] TabContext values:`, {
    tabId,
    parentTabId: parentTab?.id,
    parentRecordId: parentRecord?.id,
    parentId,
    hasParentRecord: !!parentRecord,
  });

  const columns = useMemo(() => parseColumns(Object.values(tab.fields)), [tab.fields]);

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0] || "id";
    const value = parentId;
    const operator = "equals";

    const options: DatasourceOptions = {
      windowId: tab.window,
      tabId: tab.id,
      isImplicitFilterApplied: tab.hqlfilterclause?.length > 0 || tab.sQLWhereClause?.length > 0,
      pageSize: 100,
    };

    if (language) {
      options.language = language;
    }

    if (value && value !== "" && value !== "undefined") {
      options.criteria = [
        {
          fieldName,
          value,
          operator,
        },
      ];
    }
    return options;
  }, [
    tab.parentColumns,
    tab.window,
    tab.id,
    tab.hqlfilterclause?.length,
    tab.sQLWhereClause?.length,
    parentId,
    language,
  ]);

  const {
    updateColumnFilters,
    toggleImplicitFilters,
    fetchMore,
    records,
    removeRecordLocally,
    error,
    refetch,
    loading,
    hasMoreRecords,
  } = useDatasource({
    entity: tab.entityName,
    params: query,
    columns,
    searchQuery,
    skip: !!parentTab && !parentRecord,
  });

  const handleColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      let isRealFilterChange = false;

      setColumnFilters((columnFilters) => {
        let newColumnFilters: MRT_ColumnFiltersState;

        if (typeof updaterOrValue === "function") {
          newColumnFilters = updaterOrValue(columnFilters);
        } else {
          newColumnFilters = updaterOrValue;
        }

        isRealFilterChange =
          JSON.stringify(newColumnFilters.map((f) => ({ id: f.id, value: f.value }))) !==
          JSON.stringify(columnFilters.map((f) => ({ id: f.id, value: f.value })));

        if (isRealFilterChange) {
          updateColumnFilters(newColumnFilters);
        }

        return newColumnFilters;
      });
    },
    [updateColumnFilters]
  );

  const handleTableSelectionChange = useCallback(
    (recordId: string) => {
      console.log(`[DynamicTable ${tabId}] Table selection changed: ${recordId}`);

      if (onRecordSelection) {
        onRecordSelection(recordId);
      }
    },
    [onRecordSelection, tabId]
  );

  const rowProps = useCallback<RowProps>(
    ({ row, table }) => {
      const record = row.original as Record<string, never>;
      const isSelected = row.getIsSelected();

      return {
        onClick: (event) => {
          console.log(`[DynamicTable ${tabId}] Row clicked:`, record.id);

          if (!event.ctrlKey) {
            table.setRowSelection({});
          }
          row.toggleSelected();
          setTimeout(() => {
            const newSelection = table.getState().rowSelection;
            const selectedIds = Object.keys(newSelection).filter((id) => newSelection[id]);

            if (selectedIds.length > 0 && onRecordSelection) {
              onRecordSelection(selectedIds[selectedIds.length - 1]);
            } else if (selectedIds.length === 0 && onRecordSelection) {
              onRecordSelection("");
            }
          }, 0);
        },
        onDoubleClick: (event) => {
          event.stopPropagation();
          if (!isSelected) {
            table.setRowSelection({ [record.id]: true });
            if (onRecordSelection) {
              onRecordSelection(record.id);
            }
          }
          setTimeout(() => {
            graph.setSelected(tab, row.original);

            setRecordId(record.id);
          }, 10);
        },
        sx: {
          ...(isSelected && {
            ...sx.rowSelected,
          }),
        },
        row,
        table,
      };
    },
    [graph, setRecordId, sx.rowSelected, tab, tabId, onRecordSelection]
  );

  const renderEmptyRowsFallback = useCallback(
    ({ table }: { table: MRT_TableInstance<EntityData> }) => <EmptyState table={table} />,
    []
  );

  const fetchMoreOnBottomReached = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const containerRefElement = event.target as HTMLDivElement;

      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (scrollHeight - scrollTop - clientHeight < 10 && !loading && hasMoreRecords) {
          fetchMore();
        }
      }
    },
    [fetchMore, hasMoreRecords, loading]
  );

  const table = useMaterialReactTable<EntityData>({
    muiTablePaperProps: { sx: sx.tablePaper },
    muiTableHeadCellProps: { sx: sx.tableHeadCell },
    muiTableBodyCellProps: { sx: sx.tableBodyCell },
    muiTableBodyProps: { sx: sx.tableBody },
    layoutMode: "semantic",
    enableGlobalFilter: false,
    columns,
    data: records,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    positionToolbarAlertBanner: "none",
    muiTableBodyRowProps: rowProps,
    muiTableContainerProps: {
      ref: tableContainerRef,
      sx: { flex: 1, height: "100%", maxHeight: "100%" },
      onScroll: fetchMoreOnBottomReached,
    },
    enablePagination: false,
    enableStickyHeader: true,
    enableColumnVirtualization: true,
    enableRowVirtualization: true,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    initialState: { density: "compact" },
    state: {
      columnFilters,
      showColumnFilters: true,
      showProgressBars: loading,
    },
    onColumnFiltersChange: handleColumnFiltersChange,
    getRowId,
    enableColumnFilters: true,
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnActions: true,
    manualFiltering: true,
    renderEmptyRowsFallback,
  });

  useTableSelection(tab, records, table.getState().rowSelection, handleTableSelectionChange);

  const clearSelection = useCallback(() => {
    table.resetRowSelection(true);
    setRecordId("");
  }, [setRecordId, table]);

  useEffect(() => {
    if (removeRecordLocally) {
      registerDatasource(tabId, removeRecordLocally);
    }

    registerRefetchFunction(tabId, refetch);

    return () => {
      unregisterDatasource(tabId);
    };
  }, [tabId, removeRecordLocally, registerDatasource, unregisterDatasource, registerRefetchFunction, refetch]);

  useEffect(() => {
    registerActions({
      refresh: refetch,
      filter: toggleImplicitFilters,
      back: clearSelection,
    });
  }, [clearSelection, refetch, registerActions, toggleImplicitFilters]);

  if (error) {
    return (
      <ErrorDisplay title={t("errors.tableError.title")} description={error?.message} showRetry onRetry={refetch} />
    );
  }

  // TODO Translations
  if (parentTab && !parentRecord) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">No parent record selected</div>
          <div className="text-sm">Select a record in the parent tab to view related data</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-hidden rounded-3xl transition-opacity ${
        loading ? "opacity-60 cursor-progress cursor-to-children" : "opacity-100"
      }`}>
      <MaterialReactTable table={table} />
    </div>
  );
};

export default DynamicTable;
