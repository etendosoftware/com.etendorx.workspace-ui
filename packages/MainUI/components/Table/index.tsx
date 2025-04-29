import {
  MaterialReactTable,
  MRT_ColumnFiltersState,
  MRT_Row,
  MRT_RowData,
  MRT_RowSelectionState,
  useMaterialReactTable,
  MRT_TableBodyRowProps,
  MRT_TableInstance,
} from 'material-react-table';
import { useStyle } from './styles';
import { EntityData, type Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { Button } from '@mui/material';
import { useSearch } from '../../contexts/searchContext';
import TopToolbar from './top-toolbar';
import { useDatasourceContext } from '@/contexts/datasourceContext';
import EmptyState from './EmptyState';
import { parseColumns } from '@/utils/tableColumns';

type DynamicTableProps = {
  tab: Tab;
} & ReturnType<typeof useDatasource>;

type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<Record<string, unknown>>;
  table: MRT_TableInstance<Record<string, unknown>>;
}) => Omit<MRT_TableBodyRowProps<MRT_RowData>, 'staticRowIndex'>;

const DynamicTableContent = memo(
  ({
    tab,
    records,
    loading,
    error,
    fetchMore,
    loaded,
    isImplicitFilterApplied,
    toggleImplicitFilters,
    updateColumnFilters,
    removeRecordLocally,
  }: DynamicTableProps) => {
    const { selectMultiple, clearSelections, refetch } = useMetadataContext();
    const { sx } = useStyle();
    const { searchQuery } = useSearch();
    const tabId = tab.id;
    const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
    const { registerDatasource, unregisterDatasource, registerRefetchFunction } = useDatasourceContext();
    const contentRef = useRef<HTMLDivElement>(null);
    const [maxWidth, setMaxWidth] = useState(0);

    const columns = useMemo(() => parseColumns(Object.values(tab.fields)), [tab.fields]);

    const handleColumnFiltersChange = useCallback(
      (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
        let newColumnFilters: MRT_ColumnFiltersState;

        if (typeof updaterOrValue === 'function') {
          newColumnFilters = updaterOrValue(columnFilters);
        } else {
          newColumnFilters = updaterOrValue;
        }

        const isRealFilterChange =
          JSON.stringify(newColumnFilters.map(f => ({ id: f.id, value: f.value }))) !==
          JSON.stringify(columnFilters.map(f => ({ id: f.id, value: f.value })));

        setColumnFilters(newColumnFilters);

        if (isRealFilterChange) {
          updateColumnFilters(newColumnFilters);
        }
      },
      [columnFilters, updateColumnFilters],
    );

    const handleFilterToggle = useCallback(() => {
      toggleImplicitFilters();
    }, [toggleImplicitFilters]);

    const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({}); //ts type available

    const handleClearSelections = useCallback(() => {
      clearSelections(tabId);
      setRowSelection({});
    }, [clearSelections, tabId]);

    const handleRowSelection = useCallback<typeof setRowSelection>(updater => {
      if (typeof updater == 'function') {
        setRowSelection(updater);
      } else {
        setRowSelection(prev => ({ ...prev, ...updater }));
      }
    }, []);

    const rowProps = useCallback<RowProps>(
      ({ row, table }) => {
        const isSelected = row.getIsSelected();

        return {
          onClick: (event: React.MouseEvent) => {
            if (!event.ctrlKey) {
              setRowSelection({});
            }

            row.toggleSelected();
          },
          onDoubleClick: () => {
            // navigate(`${windowId}/${tab.id}/${record.id}?parentId=${selected[tab.level - 1]?.id || null}`);
          },
          sx: {
            ...(isSelected && {
              ...sx.rowSelected,
            }),
            cursor: 'pointer',
          },
          row,
          table,
        };
      },
      [sx.rowSelected],
    );

    const renderTopToolbar = useCallback(({ table }: { table: MRT_TableInstance<Record<string, unknown>> }) => {
      return (
        <TopToolbar
          filterActive={isImplicitFilterApplied}
          toggleFilter={handleFilterToggle}
          selectedCount={table.getSelectedRowModel().rows.length}
          onClearSelection={handleClearSelections}
        />
      );
    }, [handleClearSelections, handleFilterToggle, isImplicitFilterApplied]);

    const table = useMaterialReactTable({
      muiTablePaperProps: {
        sx: sx.tablePaper,
      },
      muiTableHeadCellProps: { sx: sx.tableHeadCell },
      muiTableBodyCellProps: { sx: sx.tableBodyCell },
      muiTableBodyProps: {
        sx: sx.tableBody,
      },
      layoutMode: 'grid',
      enableGlobalFilter: false,
      columns,
      data: records,
      enableRowSelection: true,
      enableMultiRowSelection: true,
      positionToolbarAlertBanner: 'none',
      muiTableBodyRowProps: rowProps,
      enablePagination: false,
      renderTopToolbar,
      renderBottomToolbar:
        tab.uIPattern == 'STD' && !searchQuery ? (
          <Button sx={sx.fetchMore} onClick={fetchMore}>
            Load more
          </Button>
        ) : null,
      initialState: { density: 'compact' },
      state: {
        rowSelection,
        columnFilters,
        showColumnFilters: true,
      },
      onRowSelectionChange: handleRowSelection,
      onColumnFiltersChange: handleColumnFiltersChange,
      getRowId: row => String(row.id),
      enableColumnFilters: true,
      enableSorting: true,
      enableColumnActions: true,
      manualFiltering: true,
      renderEmptyRowsFallback: () => {
        return <EmptyState maxWidth={maxWidth} />;
      },
    });

    const { getSelectedRowModel } = table;

    useEffect(() => {
      selectMultiple(
        getSelectedRowModel().rows.map(row => row.original as EntityData),
        tab,
      );
    }, [getSelectedRowModel, selectMultiple, tab, rowSelection]);

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
      if (contentRef.current) {
        setMaxWidth(contentRef.current.clientWidth);
      }
    }, []);

    if (loading && !loaded) return <Spinner />;
    if (error) return <div>Error: {error.message}</div>;

    return (
      <div className="flex flex-auto w-full">
        <div className="flex flex-col w-full" ref={contentRef}>
          <MaterialReactTable table={table} />
        </div>
      </div>
    );
  },
);

DynamicTableContent.displayName = 'DynamicTableContent';

function DynamicTable({ tab, ...data }: DynamicTableProps) {
  return <DynamicTableContent tab={tab} {...data} />;
}

export default DynamicTable;
