import {
  MaterialReactTable,
  type MRT_ColumnFiltersState,
  type MRT_Row,
  useMaterialReactTable,
  type MRT_TableBodyRowProps,
  type MRT_TableInstance,
} from "material-react-table";
import { useStyle } from "./styles";
import type { DatasourceOptions, EntityData } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "../../contexts/searchContext";
import { useDatasourceContext } from "@/contexts/datasourceContext";
import EmptyState from "./EmptyState";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useLanguage } from "@/contexts/language";
import useTableSelection from "@/hooks/useTableSelection";
import { ErrorDisplay } from "../ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import { useTabContext } from "@/contexts/tab";
import { useDatasource } from "@/hooks/useDatasource";
import { useSelected } from "@/hooks/useSelected";
import { useColumns } from "@/hooks/table/useColumns";

type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<EntityData>;
  table: MRT_TableInstance<EntityData>;
}) => Omit<MRT_TableBodyRowProps<EntityData>, "staticRowIndex">;

const getRowId = (row: EntityData) => String(row.id);
interface DynamicTableProps {
  setRecordId: React.Dispatch<React.SetStateAction<string>>;
  onRecordSelection?: (recordId: string) => void;
  isTreeMode?: boolean;
}

const DynamicTable = ({ setRecordId, onRecordSelection, isTreeMode = true }: DynamicTableProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { sx } = useStyle();
  const { searchQuery } = useSearch();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const { graph } = useSelected();
  const { registerDatasource, unregisterDatasource, registerRefetchFunction } = useDatasourceContext();
  const { registerActions } = useToolbarContext();
  const { tab, parentTab, parentRecord, parentRecords } = useTabContext();
  const tabId = tab.id;
  const parentId = String(parentRecord?.id ?? "");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const clickTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const columns = useColumns(tab);

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

    if (value && value !== "" && value !== undefined) {
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
    entity: "90034CAE96E847D78FBEF6D38CB1930D",
    params: query,
    columns,
    searchQuery,
    skip: parentTab ? Boolean(!parentRecord || (parentRecords && parentRecords.length !== 1)) : false,
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
      if (onRecordSelection) {
        onRecordSelection(recordId);
      }
    },
    [onRecordSelection]
  );

  const rowProps = useCallback<RowProps>(
    ({ row, table }) => {
      const record = row.original as Record<string, never>;
      const isSelected = row.getIsSelected();
      const rowId = String(record.id);

      return {
        onClick: (event) => {
          const existingTimeout = clickTimeoutsRef.current.get(rowId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            clickTimeoutsRef.current.delete(rowId);
          }

          const timeout = setTimeout(() => {
            if (!event.ctrlKey) {
              table.setRowSelection({});
            }
            row.toggleSelected();
            clickTimeoutsRef.current.delete(rowId);
          }, 250);

          clickTimeoutsRef.current.set(rowId, timeout);
        },

        onDoubleClick: (event) => {
          event.stopPropagation();

          const timeout = clickTimeoutsRef.current.get(rowId);
          if (timeout) {
            clearTimeout(timeout);
            clickTimeoutsRef.current.delete(rowId);
          }

          const parent = graph.getParent(tab);
          const parentSelection = parent ? graph.getSelected(parent) : undefined;

          if (!isSelected) {
            row.toggleSelected();
          }

          graph.setSelected(tab, row.original);

          if (parent && parentSelection) {
            setTimeout(() => graph.setSelected(parent, parentSelection), 10);
          }
          setRecordId(record.id);
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
    [graph, setRecordId, sx.rowSelected, tab]
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
    enableExpanding: true,
    onExpandedChange: (newExpanded) => {
      // Detectar qué fila se expandió o colapsó
      const prevExpanded = expanded;
      setExpanded(newExpanded);
      const prevKeys = Object.keys(prevExpanded).filter((k) => prevExpanded[k]);
      const newKeys = Object.keys(newExpanded).filter((k) => newExpanded[k]);
      const expandedRowIds = newKeys.filter((k) => !prevKeys.includes(k));
      const collapsedRowIds = prevKeys.filter((k) => !newKeys.includes(k));

      expandedRowIds.forEach((id) => console.log("Se expandió la fila con id:", id));
      collapsedRowIds.forEach((id) => console.log("Se colapsó la fila con id:", id));
    },
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

  useEffect(() => {
    const handleGraphClear = (eventTab: typeof tab) => {
      if (eventTab.id === tab.id) {
        const currentSelection = table.getState().rowSelection;
        const hasTableSelection = Object.keys(currentSelection).some((id) => currentSelection[id]);

        if (hasTableSelection) {
          table.resetRowSelection(true);
        }
      }
    };

    graph.addListener("unselected", handleGraphClear);
    graph.addListener("unselectedMultiple", handleGraphClear);

    return () => {
      graph.removeListener("unselected", handleGraphClear);
      graph.removeListener("unselectedMultiple", handleGraphClear);
    };
  }, [graph, table, tabId, tab.id]);

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
      save: async () => {},
    });
  }, [refetch, registerActions, toggleImplicitFilters]);

  if (error) {
    return (
      <ErrorDisplay title={t("errors.tableError.title")} description={error?.message} showRetry onRetry={refetch} />
    );
  }

  if (parentTab && !parentRecord) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">{t("errors.selectionError.title")}</div>
          <div className="text-sm">{t("errors.selectionError.description")}</div>
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
