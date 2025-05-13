import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  MaterialReactTable,
  MRT_ColumnFiltersState,
  MRT_Row,
  MRT_RowSelectionState,
  useMaterialReactTable,
} from 'material-react-table';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import type { EntityData, EntityValue } from '@workspaceui/etendohookbinder/src/api/types';
import Loading from '../loading';
import { ErrorDisplay } from '../ErrorDisplay';
import EmptyState from '../Table/EmptyState';
import { parseColumns } from '@/utils/tableColumns';
import { useTab } from '@/hooks/useTab';
import { useProcessConfig } from '@/hooks/datasource/useProcessDatasourceConfig';
import { WindowReferenceGridProps } from './types';
import { tableStyles } from './styles';

function WindowReferenceGrid({
  parameter,
  onSelectionChange,
  tabId,
  windowId,
  entityName,
  processId,
  recordValues = {},
  session,
  windowReferenceTab,
}: WindowReferenceGridProps) {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);

  const { loading: tabLoading, error: tabError } = useTab(windowReferenceTab.id);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const maxWidth = 100;

  const {
    fetchConfig,
    loading: processConfigLoading,
    error: processConfigError,
    config: processConfig,
  } = useProcessConfig({
    processId: processId || parameter.processId || '',
    windowId: windowId || '',
    tabId: tabId,
  });

  useEffect(() => {
    const loadConfig = async () => {
      const combinedPayload = {
        ...recordValues,
        ...session,
      };
      await fetchConfig(combinedPayload);
    };

    loadConfig();
  }, [fetchConfig, recordValues, session, tabId]);

  const datasourceOptions = useMemo(() => {
    const options: Record<string, EntityValue> = {
      windowId: windowId || '',
      tabId: parameter.tab || tabId,
      pageSize: 100,
    };

    if (processConfig?.defaults) {
      Object.entries(processConfig.defaults).forEach(([key, value]) => {
        options[key] = value.value;

        if (key === 'ad_org_id') {
          options.org = value.value;
        }
      });
    }

    let criteria: Array<{ fieldName: string; operator: string; value: EntityValue }> = [];

    if (processConfig?.filterExpressions?.grid) {
      const filterCriteria = Object.entries(processConfig.filterExpressions.grid).map(([fieldName, value]) => ({
        fieldName,
        operator: 'equals',
        value: value === 'true' ? true : value === 'false' ? false : value,
      }));

      criteria = [...criteria, ...filterCriteria];
    }

    if (criteria.length > 0) {
      options.orderBy = 'documentNo desc';
    }

    return options;
  }, [windowId, tabId, parameter.tab, processConfig]);

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
    updateColumnFilters,
    refetch,
    hasMoreRecords,
    fetchMore,
  } = useDatasource(String(entityName), datasourceOptions);

  useEffect(() => {
    console.debug('records:', records);
  }, [records]);

  useEffect(() => {
    setRowSelection({});
    onSelectionChange([]);
  }, [records, onSelectionChange]);

  const handleRowSelection = useCallback<typeof setRowSelection>(
    updater => {
      setRowSelection(prev => {
        const newSelection = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };

        const selectedItems = records.filter(record => {
          const recordId = String(record.id);
          return newSelection[recordId];
        });

        onSelectionChange(selectedItems);
        return newSelection;
      });
    },
    [records, onSelectionChange],
  );

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

      if (isRealFilterChange && updateColumnFilters) {
        updateColumnFilters(newColumnFilters);
      }
    },
    [columnFilters, updateColumnFilters],
  );

  const handleClearSelections = useCallback(() => {
    setRowSelection({});
    onSelectionChange([]);
  }, [onSelectionChange]);

  const rowProps = useCallback(
    ({ row }: { row: MRT_Row<EntityData> }) => ({
      onClick: () => {
        const selectedRows = { ...rowSelection };
        selectedRows[row.id] = !selectedRows[row.id];
        handleRowSelection(selectedRows);
      },
      className: rowSelection[row.id]
        ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
        : 'hover:bg-gray-50 cursor-pointer',
    }),
    [handleRowSelection, rowSelection],
  );

  const LoadMoreButton = ({ fetchMore }: { fetchMore: () => void }) => (
    <div className="flex justify-center p-2 border-t border-gray-200">
      <button
        onClick={fetchMore}
        className="px-4 py-2 text-sm border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100 transition-colors">
        {t('common.loadMore')}
      </button>
    </div>
  );

  const table = useMaterialReactTable<EntityData>({
    muiTablePaperProps: {
      className: tableStyles.paper,
      style: {
        borderRadius: '1rem',
        boxShadow: 'none',
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
    muiTableBodyRowProps: rowProps,
    muiTableContainerProps: {
      className: tableStyles.container,
    },
    layoutMode: 'semantic',
    enableColumnResizing: true,
    enableGlobalFilter: false,
    columns,
    data: records || [],
    enableRowSelection: true,
    enableMultiRowSelection: true,
    positionToolbarAlertBanner: 'none',
    enablePagination: false,
    enableStickyHeader: true,
    enableStickyFooter: true,
    renderTopToolbar: props => {
      const selectedCount = props.table.getSelectedRowModel().rows.length;
      return (
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b max-h-[2.5rem]">
          <div className="text-base font-medium text-gray-800">{parameter.name}</div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedCount} {t('table.selection.multiple')}
              </span>
              <button
                onClick={handleClearSelections}
                className="px-3 py-1 text-sm cursor-pointer text-gray-700 border border-gray-300 rounded-full hover:bg-(--color-etendo-main) hover:text-(--color-baseline-0) transition-colors">
                {t('common.clear')}
              </button>
            </div>
          )}
        </div>
      );
    },
    renderBottomToolbar: hasMoreRecords ? () => <LoadMoreButton fetchMore={fetchMore} /> : undefined,
    initialState: {
      density: 'compact',
    },
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
    renderEmptyRowsFallback: () => (
      <div className="flex justify-center items-center p-8 text-gray-500">
        <EmptyState maxWidth={maxWidth} />
      </div>
    ),
  });

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
    return <ErrorDisplay title={t('errors.missingData')} description={error?.message} showRetry onRetry={refetch} />;
  }

  if ((fields.length === 0 && !tabLoading) || !records || records.length === 0) {
    return <EmptyState maxWidth={maxWidth} />;
  }

  return (
    <div
      className={`flex flex-col w-full overflow-hidden max-h-4xl h-full transition duration-100 ${datasourceLoading ? 'opacity-40 cursor-wait cursor-to-children' : 'opacity-100'}`}
      ref={contentRef}>
      <MaterialReactTable table={table} />
    </div>
  );
}

export default WindowReferenceGrid;
