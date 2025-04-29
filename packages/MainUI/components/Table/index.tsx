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
import { DatasourceOptions, FormMode, WindowMetadata, type Tab } from '@workspaceui/etendohookbinder/src/api/types';
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
import { useSearchParams } from 'next/navigation';
import FormView from '../Form/FormView';
import { useToolbarContext } from '@/contexts/ToolbarContext';
import { useLanguage } from '@/contexts/language';

type DynamicTableProps = {
  tab: Tab;
  window: WindowMetadata | undefined;
};

type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<Record<string, unknown>>;
  table: MRT_TableInstance<Record<string, unknown>>;
}) => Omit<MRT_TableBodyRowProps<MRT_RowData>, 'staticRowIndex'>;

const DynamicTableContent = memo(({ tab }: DynamicTableProps) => {
  const { selected, selectRecord, setSelectedMultiple, clearSelections, getSelectedCount } = useMetadataContext();
  const { sx } = useStyle();
  const { searchQuery } = useSearch();
  const { language } = useLanguage();

  const tabId = tab.id;
  const selectedCount = useMemo(() => getSelectedCount(tabId), [getSelectedCount, tabId]);
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
    const value = parent?.id || '';
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
    loaded,
    loading,
    refetch,
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
    clearSelections(tabId);
    setRowSelection({});
  }, [clearSelections, tabId]);

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
          if ((event.target as HTMLElement).closest('.MuiCheckbox-root')) {
            return;
          }

          row.toggleSelected();
          selectRecord(record, tab);

          if (isSelected) {
            setSelectedMultiple(prev => {
              const result = { ...prev };
              delete result[tab.id][record.id];

              return result;
            });
          } else {
            setSelectedMultiple(prev => {
              const result = { ...prev };

              if (!result[tab.id]) {
                result[tab.id] = {};
              }

              result[tab.id][record.id] = record;

              return result;
            });
          }
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
    [searchParams, selectRecord, setSelectedMultiple, sx.rowSelected, tab],
  );

  const CustomTopToolbar = useCallback(() => {
    return (
      <TopToolbar
        filterActive={isImplicitFilterApplied}
        toggleFilter={handleFilterToggle}
        selectedCount={selectedCount}
        onClearSelection={handleClearSelections}
      />
    );
  }, [isImplicitFilterApplied, handleFilterToggle, selectedCount, handleClearSelections]);

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
    renderTopToolbar: <CustomTopToolbar />,
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

  if (loading && !loaded) {
    return <Spinner />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  return (
    <div className="flex flex-auto w-full">
      <div className="flex flex-col w-full" ref={contentRef}>
        <MaterialReactTable table={table} />
      </div>
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
