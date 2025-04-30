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
import {
  DatasourceOptions,
  EntityData,
  FormMode,
  WindowMetadata,
  type Tab,
} from '@workspaceui/etendohookbinder/src/api/types';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { Button } from '@mui/material';
import { useSearch } from '../../contexts/searchContext';
import TopToolbar from './top-toolbar';
import { useDatasourceContext } from '@/contexts/datasourceContext';
import EmptyState from './EmptyState';
import { parseColumns } from '@/utils/tableColumns';
import { useSearchParams } from 'next/navigation';
import FormView from '../Form/FormView';
import { useToolbarContext } from '@/contexts/ToolbarContext';
import { useLanguage } from '@/contexts/language';
import { useSelected } from '@/contexts/selected';
import useTableSelection from '@/hooks/useTableSelection';
import { ErrorDisplay } from '../ErrorDisplay';
import { useTranslation } from '@/hooks/useTranslation';

type DynamicTableProps = {
  tab: Tab;
  window: WindowMetadata | undefined;
};

type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<EntityData>;
  table: MRT_TableInstance<EntityData>;
}) => Omit<MRT_TableBodyRowProps<MRT_RowData>, 'staticRowIndex'>;

const DynamicTableContent = memo(({ tab }: DynamicTableProps) => {
  const { sx } = useStyle();
  const { searchQuery } = useSearch();
  const { language } = useLanguage();
  const { selected } = useSelected();

  const tabId = tab.id;
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const { registerDatasource, unregisterDatasource, registerRefetchFunction } = useDatasourceContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxWidth, setMaxWidth] = useState(0);
  const searchParams = useSearchParams();
  const { registerActions } = useToolbarContext();

  const columns = useMemo(() => parseColumns(Object.values(tab.fields)), [tab.fields]);

  const parent = selected[tab.level - 1];

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0] || 'id';
    const value = String(parent?.id || '');
    const operator = 'equals';

    const options: DatasourceOptions = {
      windowId: tab.windowId,
      tabId: tab.id,
      isImplicitFilterApplied: tab.hqlfilterclause?.length > 0 || tab.sQLWhereClause?.length > 0,
      pageSize: 100,
      language,
    };

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
  }, [language, parent?.id, tab]);

  const {
    updateColumnFilters,
    toggleImplicitFilters,
    isImplicitFilterApplied,
    fetchMore,
    records,
    removeRecordLocally,
    error,
    refetch,
    loading,
  } = useDatasource(tab.entityName, query, searchQuery, columns);

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
    setRowSelection({});
  }, []);

  const handleRowSelection = useCallback<typeof setRowSelection>(updater => {
    if (typeof updater == 'function') {
      setRowSelection(prev => updater(prev));
    } else {
      setRowSelection(prev => ({ ...prev, ...updater }));
    }
  }, []);

  const rowProps = useCallback<RowProps>(
    ({ row, table }) => {
      const record = row.original as Record<string, never>;
      const isSelected = row.getIsSelected();

      return {
        onClick: (event: React.MouseEvent) => {
          if (!event.ctrlKey) {
            setRowSelection({});
          }

          row.toggleSelected();
        },
        onDoubleClick: () => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('recordId_' + tab.id, record.id);
          history.pushState(null, '', `?${params.toString()}`);
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
    [searchParams, sx.rowSelected, tab.id],
  );

  const table = useMaterialReactTable<EntityData>({
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
    enableStickyHeader: true,
    renderTopToolbar: props => {
      return (
        <TopToolbar
          filterActive={isImplicitFilterApplied}
          toggleFilter={handleFilterToggle}
          selectedCount={props.table.getSelectedRowModel().rows.length}
          onClearSelection={handleClearSelections}
        />
      );
    },
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
    enableColumnResizing: true,
    enableColumnActions: true,
    manualFiltering: true,
    renderEmptyRowsFallback: () => {
      return <EmptyState maxWidth={maxWidth} />;
    },
  });

  useTableSelection(table, rowSelection);

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

  useEffect(() => {
    registerActions({
      refresh: refetch,
    });
  }, [refetch, registerActions]);

  const { t } = useTranslation();

  if (error) {
    return (
      <ErrorDisplay title={t('errors.tableError.title')} description={error.message} showRetry onRetry={refetch} />
    );
  }

  return (
    <div
      className={`flex flex-col w-full overflow-auto h-full transition duration-100 ${loading ? 'opacity-40 cursor-wait cursor-to-children' : 'opacity-100'}`}
      ref={contentRef}>
      <MaterialReactTable table={table} />
    </div>
  );
});

DynamicTableContent.displayName = 'DynamicTableContent';

function DynamicTable({ tab, window: windowMetadata }: DynamicTableProps) {
  const { selected } = useMetadataContext();
  const params = useSearchParams();
  const recordId = params.get('recordId_' + tab.id);

  const level = tab?.level ?? 0;

  const isTabVisible = level === 0 || Boolean(selected?.[level - 1]);

  if (recordId) {
    const mode = recordId === 'new' ? FormMode.NEW : FormMode.EDIT;
    return <FormView mode={mode} tab={tab} window={windowMetadata} recordId={recordId} />;
  }

  if (isTabVisible) {
    return <DynamicTableContent tab={tab} window={windowMetadata} />;
  }

  return null;
}

export default DynamicTable;
