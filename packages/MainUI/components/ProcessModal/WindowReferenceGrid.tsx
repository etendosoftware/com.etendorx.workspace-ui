import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  MaterialReactTable,
  MRT_ColumnFiltersState,
  MRT_Row,
  MRT_RowSelectionState,
  useMaterialReactTable,
  MRT_TableInstance,
} from 'material-react-table';
import { Button } from '@mui/material';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import type { EntityData, EntityValue, ProcessParameter } from '@workspaceui/etendohookbinder/src/api/types';
import Loading from '../loading';
import { ErrorDisplay } from '../ErrorDisplay';
import { useStyle } from '../Table/styles';
import EmptyState from '../Table/EmptyState';
import { parseColumns } from '@/utils/tableColumns';
import { useTab } from '@/hooks/useTab';
import { useProcessConfig } from '@/hooks/datasource/useProcessDatasourceConfig';

interface WindowReferenceGridProps {
  parameter: ProcessParameter;
  onSelectionChange: (selection: unknown[]) => void;
  entityName?: EntityValue;
  recordId?: EntityValue;
  tabId: string;
  windowId?: string;
  processId?: string;
  recordValues?: Record<string, any>;
  session?: any;
}

function WindowReferenceGrid({
  parameter,
  onSelectionChange,
  tabId,
  windowId,
  entityName,
  processId,
  recordValues = {},
  session,
}: WindowReferenceGridProps) {
  const { t } = useTranslation();
  const { sx } = useStyle();
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: tabData, loading: tabLoading, error: tabError } = useTab(parameter.tab || tabId);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const maxWidth = 100;

  useEffect(() => {
    console.debug('Record values provided:', recordValues);
    console.debug('Session data provided:', session);
  }, [recordValues, session]);

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
    const options: Record<string, any> = {
      windowId: windowId || '',
      tabId: parameter.tab || tabId,
      pageSize: 100,
    };

    if (processConfig?.filterExpressions?.grid) {
      options.filterExpressions = processConfig.filterExpressions.grid;
    }

    if (processConfig?.defaults) {
      const criteria = Object.entries(processConfig.defaults).map(([fieldName, value]) => ({
        fieldName,
        operator: 'equals',
        value: value.value,
      }));

      if (criteria.length > 0) {
        options.criteria = criteria;
      }
    }

    return options;
  }, [windowId, tabId, parameter.tab, processConfig]);

  const fields = useMemo(() => {
    if (tabData?.fields) {
      return Object.values(tabData.fields);
    }
    return [];
  }, [tabData]);

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
    ({ row, table }: { row: MRT_Row<EntityData>; table: MRT_TableInstance<EntityData> }) => {
      const isSelected = row.getIsSelected();

      return {
        onClick: (event: React.MouseEvent) => {
          if (!event.ctrlKey) {
            setRowSelection({});
          }
          row.toggleSelected();
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
    [sx.rowSelected],
  );

  const table = useMaterialReactTable<EntityData>({
    muiTablePaperProps: {
      sx: { ...sx.tablePaper, maxHeight: '30rem' },
    },
    muiTableHeadCellProps: { sx: sx.tableHeadCell },
    muiTableBodyCellProps: { sx: sx.tableBodyCell },
    muiTableBodyProps: {
      sx: sx.tableBody,
    },
    layoutMode: 'grid',
    enableGlobalFilter: false,
    columns,
    data: records || [],
    enableRowSelection: true,
    enableMultiRowSelection: true,
    positionToolbarAlertBanner: 'none',
    muiTableBodyRowProps: rowProps,
    muiTableContainerProps: {
      className: 'flex-1',
    },
    enablePagination: false,
    enableStickyHeader: true,
    enableStickyFooter: true,
    renderTopToolbar: props => {
      const selectedCount = props.table.getSelectedRowModel().rows.length;
      return (
        <div className="flex justify-between p-2 bg-gray-50 border-b">
          <div className="text-lg font-medium">{parameter.name}</div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span>
                {selectedCount} {t('table.selection.multiple')}
              </span>
              <Button variant="outlined" size="small" onClick={handleClearSelections}>
                {t('common.clear')}
              </Button>
            </div>
          )}
        </div>
      );
    },
    renderBottomToolbar: hasMoreRecords ? (
      <Button sx={sx.fetchMore} onClick={fetchMore}>
        {t('common.loadMore')}
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
    enableColumnResizing: true,
    enableColumnActions: true,
    manualFiltering: true,
    renderEmptyRowsFallback: () => {
      return <EmptyState maxWidth={maxWidth} />;
    },
  });

  // Show loading state when any of the data fetching is in progress
  const isLoading = tabLoading || processConfigLoading || datasourceLoading;

  // Combine errors
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
