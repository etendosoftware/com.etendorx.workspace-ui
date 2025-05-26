import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  MaterialReactTable,
  MRT_ColumnFiltersState,
  MRT_Row,
  MRT_RowSelectionState,
  MRT_TopToolbarProps,
  useMaterialReactTable,
  MRT_TableOptions,
} from 'material-react-table';
import type { EntityData, EntityValue } from '@workspaceui/etendohookbinder/src/api/types';
import Loading from '../loading';
import { ErrorDisplay } from '../ErrorDisplay';
import EmptyState from '../Table/EmptyState';
import { parseColumns } from '@/utils/tableColumns';
import { useTab } from '@/hooks/useTab';

import { WindowReferenceGridProps } from './types';
import { tableStyles } from './styles';
import { useDatasource } from '@/hooks/useDatasource';

const MAX_WIDTH = 100;
const PAGE_SIZE = 100;

/**
 * WindowReferenceGrid Component
 * Displays a grid of referenced records that can be selected
 */
function WindowReferenceGrid({
  parameter,
  onSelectionChange,
  tabId,
  windowId,
  entityName,
  windowReferenceTab,
  processConfig,
  processConfigLoading,
  processConfigError,
}: WindowReferenceGridProps) {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const { loading: tabLoading, error: tabError } = useTab(windowReferenceTab?.id);

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const datasourceOptions = useMemo(() => {
    const options: Record<string, EntityValue> = {
      windowId: windowId || '',
      tabId: parameter.tab || tabId,
      pageSize: PAGE_SIZE,
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
  } = useDatasource({
    entity: String(entityName),
    ...datasourceOptions,
  });

  useEffect(() => {
    setRowSelection({});
    onSelectionChange([]);
  }, [records, onSelectionChange]);

  const handleRowSelection = useCallback(
    (updaterOrValue: MRT_RowSelectionState | ((prev: MRT_RowSelectionState) => MRT_RowSelectionState)) => {
      const newSelection = typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection) : updaterOrValue;

      setRowSelection(newSelection);

      const selectedItems = records.filter((record) => {
        const recordId = String(record.id);
        return newSelection[recordId];
      });

      onSelectionChange(selectedItems);
    },
    [records, onSelectionChange, rowSelection],
  );

  const handleColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      const newColumnFilters = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters) : updaterOrValue;

      const normalizedNew = newColumnFilters.map((f) => ({ id: f.id, value: f.value }));
      const normalizedCurrent = columnFilters.map((f) => ({ id: f.id, value: f.value }));

      const isRealFilterChange = JSON.stringify(normalizedNew) !== JSON.stringify(normalizedCurrent);

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
    [records, onSelectionChange],
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
    [parameter.name, t, handleClearSelections],
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

  const tableOptions: MRT_TableOptions<EntityData> = {
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
    muiTableBodyRowProps: ({ row }) => {
      return {
        onClick: () => handleRowClick(row),
        className: rowSelection[row.id]
          ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
          : 'hover:bg-gray-50 cursor-pointer',
      };
    },
    muiTableContainerProps: {
      className: tableStyles.container,
    },
    layoutMode: 'semantic',
    enableColumnResizing: true,
    enableGlobalFilter: false,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    positionToolbarAlertBanner: 'none',
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
    renderBottomToolbar: hasMoreRecords ? () => <LoadMoreButton fetchMore={fetchMore} /> : undefined,
    renderEmptyRowsFallback: () => (
      <div className="flex justify-center items-center p-8 text-gray-500">
        <EmptyState maxWidth={MAX_WIDTH} />
      </div>
    ),
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
    return <ErrorDisplay title={t('errors.missingData')} description={error?.message} showRetry onRetry={refetch} />;
  }

  if ((fields.length === 0 && !tabLoading) || !records || records.length === 0) {
    return <EmptyState maxWidth={MAX_WIDTH} />;
  }

  return (
    <div
      className={`flex flex-col w-full overflow-hidden max-h-4xl h-full transition duration-100 ${
        datasourceLoading ? 'opacity-40 cursor-wait cursor-to-children' : 'opacity-100'
      }`}
      ref={contentRef}>
      <MaterialReactTable table={table} />
    </div>
  );
}

export default WindowReferenceGrid;
