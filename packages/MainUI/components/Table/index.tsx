import Box from '@mui/material/Box';
import { MaterialReactTable, MRT_ColumnFiltersState, MRT_Row } from 'material-react-table';
import { useStyle } from './styles';
import type { DatasourceOptions, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { useParams, useRouter } from 'next/navigation';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { parseColumns } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { Button } from '@mui/material';
import { WindowParams } from '../../app/types';
import { useLanguage } from '../../hooks/useLanguage';
import { useSearch } from '../../contexts/searchContext';
import TopToolbar from './top-toolbar';
import { useDatasourceContext } from '@/contexts/datasourceContext';

type DynamicTableProps = {
  tab: Tab;
};

const DynamicTableContent = memo(function DynamicTableContent({ tab }: DynamicTableProps) {
  const {
    selected,
    selectRecord,
    selectMultiple,
    isSelected,
    clearSelections,
    getSelectedCount,
    getSelectedIds,
    setShowTabContainer,
    groupedTabs,
    refetch,
  } = useMetadataContext();
  const { windowId } = useParams<WindowParams>();
  const parent = selected[tab.level - 1];
  const navigate = useRouter().push;
  const { sx } = useStyle();
  const { language } = useLanguage();
  const { searchQuery } = useSearch();
  const tabId = tab.id;
  const selectedIds = useMemo(() => getSelectedIds(tabId), [getSelectedIds, tabId]);
  const selectedCount = useMemo(() => getSelectedCount(tabId), [getSelectedCount, tabId]);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const { registerDatasource, unregisterDatasource, registerRefetchFunction } = useDatasourceContext();

  const rowSelection = useMemo(() => {
    return selectedIds.reduce(
      (obj, id) => {
        obj[id] = true;
        return obj;
      },
      {} as Record<string, boolean>,
    );
  }, [selectedIds]);

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0] || 'id';
    const value = parent?.id || '';
    const operator = 'equals';

    const options: DatasourceOptions = {
      windowId,
      tabId,
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
  }, [language, parent?.id, tab, tabId, windowId]);

  const columns = useMemo(() => parseColumns(Object.values(tab.fields)), [tab.fields]);

  const {
    records,
    loading,
    error,
    fetchMore,
    loaded,
    isImplicitFilterApplied,
    toggleImplicitFilters,
    updateColumnFilters,
    removeRecordLocally,
  } = useDatasource(tab.entityName, query, searchQuery, columns, columnFilters);

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

  const handleClearSelections = useCallback(() => {
    clearSelections(tabId);
  }, [clearSelections, tabId]);

  const mapSelectionToIds = useCallback((selection: Record<string, boolean>): string[] => {
    return Object.entries(selection)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
  }, []);

  const rowProps = useCallback(
    ({ row }: { row: MRT_Row<Record<string, unknown>> }) => {
      const record = row.original as Record<string, never>;
      const id = String(record.id);
      const isRowSelected = isSelected(id, tabId);

      return {
        onClick: (event: React.MouseEvent) => {
          if ((event.target as HTMLElement).closest('.MuiCheckbox-root')) {
            return;
          }

          if (event.ctrlKey || event.metaKey) {
            if (isRowSelected) {
              const newSelection = selectedIds.filter(selectedId => selectedId !== id);
              selectMultiple(newSelection, tab, true);
            } else {
              selectMultiple([...selectedIds, id], tab, true);
            }
          } else {
            const isSameRecordSelected = selected[tab.level]?.id === record.id;

            if (isSameRecordSelected) {
              clearSelections(tabId);
              selectRecord(record, tab);
            } else {
              selectMultiple([id], tab, true);
              selectRecord(record, tab);

              const nextLevel = tab.level + 1;
              const hasNextLevelTabs = groupedTabs.some(tabs => tabs[0]?.level === nextLevel);
              if (hasNextLevelTabs) {
                setShowTabContainer(true);
              }
            }
          }
        },
        onDoubleClick: () => {
          selectRecord(record, tab);
          navigate(`${windowId}/${tab.id}/${record.id}?parentId=${selected[tab.level - 1]?.id || null}`);
        },
        onAuxClick: () => {
          selectRecord(record, tab);
        },
        sx: {
          ...(isRowSelected && {
            ...sx.rowSelected,
          }),
        },
      };
    },
    [
      isSelected,
      navigate,
      selectMultiple,
      selectRecord,
      clearSelections,
      selectedIds,
      selected,
      setShowTabContainer,
      sx.rowSelected,
      tab,
      tabId,
      windowId,
      groupedTabs,
    ],
  );

  const handleRowSelectionChange = useCallback(
    (updaterOrValue: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
      let newSelection: Record<string, boolean>;
      if (typeof updaterOrValue === 'function') {
        newSelection = updaterOrValue(rowSelection);
      } else {
        newSelection = updaterOrValue;
      }

      const newSelectedIds = mapSelectionToIds(newSelection);

      if (newSelectedIds.length === 0) {
        clearSelections(tabId);

        if (selected[tab.level]) {
          selectRecord(selected[tab.level], tab);
        }
        return;
      }

      selectMultiple(newSelectedIds, tab, true);

      if (newSelectedIds.length === 1) {
        const record = records.find(r => String(r.id) === newSelectedIds[0]) as Record<string, never>;
        if (record) {
          selectRecord(record, tab);
        }
      }
    },
    [mapSelectionToIds, rowSelection, records, selectMultiple, selectRecord, clearSelections, selected, tab, tabId],
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

  useEffect(() => {
    if (removeRecordLocally) {
      registerDatasource(tabId, removeRecordLocally);
    }

    registerRefetchFunction(tabId, refetch);

    return () => {
      unregisterDatasource(tabId);
    };
  }, [tabId, removeRecordLocally, registerDatasource, unregisterDatasource, registerRefetchFunction, refetch]);

  if (loading && !loaded) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Box className="flex h-10/12">
      <Box className="flex flex-col h-full overflow-hidden">
        <Box sx={sx.container}>
          <Box sx={sx.table}>
            <MaterialReactTable
              enableGlobalFilter={false}
              columns={columns}
              data={records}
              enableRowSelection={true}
              enableMultiRowSelection={true}
              positionToolbarAlertBanner="none"
              muiTableBodyRowProps={rowProps}
              enablePagination={false}
              renderTopToolbar={<CustomTopToolbar />}
              renderBottomToolbar={
                tab.uIPattern == 'STD' && !searchQuery ? (
                  <Button sx={sx.fetchMore} onClick={fetchMore}>
                    Load more
                  </Button>
                ) : null
              }
              initialState={{ density: 'compact' }}
              muiTablePaperProps={{
                sx: sx.tablePaper,
              }}
              muiTableHeadCellProps={{ sx: sx.tableHeadCell }}
              muiTableBodyCellProps={{ sx: sx.tableBodyCell }}
              muiTableBodyProps={{ sx: sx.tableBody }}
              state={{
                rowSelection,
                columnFilters,
                showColumnFilters: true,
              }}
              onRowSelectionChange={handleRowSelectionChange}
              onColumnFiltersChange={handleColumnFiltersChange}
              getRowId={row => String(row.id)}
              enableColumnFilters={true}
              enableSorting={true}
              enableColumnActions={true}
              manualFiltering={true}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

const DynamicTable = ({ tab }: DynamicTableProps) => {
  const { selected } = useMetadataContext();

  if (selected && (selected[tab?.level - 1] || tab?.level === 0)) {
    return <DynamicTableContent tab={tab} />;
  }

  return null;
};

export default DynamicTable;
