import {
  MaterialReactTable,
  MRT_ColumnFiltersState,
  MRT_Row,
  useMaterialReactTable,
  MRT_TableBodyRowProps,
  MRT_TableInstance,
} from 'material-react-table';
import { useStyle } from './styles';
import { DatasourceOptions, EntityData } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearch } from '../../contexts/searchContext';
import { useDatasourceContext } from '@/contexts/datasourceContext';
import EmptyState from './EmptyState';
import { parseColumns } from '@/utils/tableColumns';
import { useToolbarContext } from '@/contexts/ToolbarContext';
import { useLanguage } from '@/contexts/language';
import useTableSelection from '@/hooks/useTableSelection';
import { ErrorDisplay } from '../ErrorDisplay';
import { useTranslation } from '@/hooks/useTranslation';
import { useTabContext } from '@/contexts/tab';
import { useDatasource } from '@/hooks/useDatasource';

type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<EntityData>;
  table: MRT_TableInstance<EntityData>;
}) => Omit<MRT_TableBodyRowProps<EntityData>, 'staticRowIndex'>;

const getRowId = (row: EntityData) => String(row.id);

const DynamicTable = ({ setRecordId }: { setRecordId: React.Dispatch<React.SetStateAction<string>> }) => {
  const { sx } = useStyle();
  const { searchQuery } = useSearch();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const { registerDatasource, unregisterDatasource, registerRefetchFunction } = useDatasourceContext();
  const { registerActions } = useToolbarContext();
  const { tab, parentTab, parentRecord } = useTabContext();
  const tabId = tab.id;
  const parentId = String(parentRecord?.id ?? '');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => parseColumns(Object.values(tab.fields)), [tab.fields]);

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0] || 'id';
    const value = parentId;
    const operator = 'equals';

    const options: DatasourceOptions = {
      windowId: tab.window,
      tabId: tab.id,
      isImplicitFilterApplied: tab.hqlfilterclause?.length > 0 || tab.sQLWhereClause?.length > 0,
      pageSize: 100,
    };

    if (language) {
      options.language = language;
    }

    if (value) {
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
    language,
    parentId,
    tab.hqlfilterclause?.length,
    tab.id,
    tab.parentColumns,
    tab.sQLWhereClause?.length,
    tab.window,
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

        if (typeof updaterOrValue === 'function') {
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
    [updateColumnFilters],
  );

  const rowProps = useCallback<RowProps>(
    ({ row, table }) => {
      const record = row.original as Record<string, never>;
      const isSelected = row.getIsSelected();
      let clickTimeout: NodeJS.Timeout | null = null;

      return {
        onClick: event => {
          if (clickTimeout) return;

          clickTimeout = setTimeout(() => {
            if (!event.ctrlKey) {
              table.setRowSelection({});
            }

            row.toggleSelected();
            clickTimeout = null;
          }, 100);
        },
        onDoubleClick: () => {
          if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
          }

          if (!isSelected) {
            row.toggleSelected();
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
    [setRecordId, sx.rowSelected],
  );

  const renderEmptyRowsFallback = useCallback(
    ({ table }: { table: MRT_TableInstance<EntityData> }) => <EmptyState table={table} />,
    [],
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
    [fetchMore, hasMoreRecords, loading],
  );

  const table = useMaterialReactTable<EntityData>({
    muiTablePaperProps: { sx: sx.tablePaper },
    muiTableHeadCellProps: { sx: sx.tableHeadCell },
    muiTableBodyCellProps: { sx: sx.tableBodyCell },
    muiTableBodyProps: { sx: sx.tableBody },
    enableGlobalFilter: false,
    columns,
    data: records,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    positionToolbarAlertBanner: 'none',
    muiTableBodyRowProps: rowProps,
    muiTableContainerProps: {
      ref: tableContainerRef,
      sx: { flex: 1, height: '100%', maxHeight: '100%' }, //give the table a max height
      onScroll: fetchMoreOnBottomReached,
    },
    enablePagination: false,
    enableStickyHeader: true,
    enableColumnVirtualization: true,
    enableRowVirtualization: true,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    initialState: { density: 'compact' },
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

  useTableSelection(tab, records, table.getState().rowSelection);

  const clearSelection = useCallback(() => {
    table.resetRowSelection(true);
    setRecordId('');
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
      <ErrorDisplay title={t('errors.tableError.title')} description={error?.message} showRetry onRetry={refetch} />
    );
  }

  return (
    <div
      className={`h-full overflow-hidden rounded-3xl transition-opacity ${loading ? 'opacity-60 cursor-progress cursor-to-children' : 'opacity-100'}`}>
      <MaterialReactTable table={table} />
    </div>
  );
};

export default DynamicTable;
