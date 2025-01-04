import Box from '@mui/material/Box';
import { MaterialReactTable, MRT_Row } from 'material-react-table';
import { useStyle } from './styles';
import type { DatasourceOptions, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { memo, useCallback, useMemo, useState } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { useParams, useRouter } from 'next/navigation';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { parseColumns } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { Button } from '@mui/material';
import DynamicFormView from '../../screens/Form/DynamicFormView';
import { WindowParams } from '../../app/types';

type DynamicTableProps = {
  tab: Tab;
};

const initialState = { density: 'compact' as const };

const DynamicTableContent = memo(function DynamicTableContent({ tab }: DynamicTableProps) {
  const { selected, selectRecord } = useMetadataContext();
  const { windowId } = useParams<WindowParams>();
  const parent = selected[tab.level - 1];
  const navigate = useRouter().push;
  const { sx } = useStyle();
  const muiTablePaperProps = useMemo(() => ({ sx: sx.tablePaper }), [sx.tablePaper]);
  const muiTableHeadCellProps = useMemo(() => ({ sx: sx.tableHeadCell }), [sx.tableHeadCell]);
  const muiTableBodyCellProps = useMemo(() => ({ sx: sx.tableBodyCell }), [sx.tableBodyCell]);
  const muiTableBodyProps = useMemo(() => ({ sx: sx.tableBody }), [sx.tableBody]);
  const [editing, setEditing] = useState(false);

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0] || 'id';
    const value = parent?.id || '';
    const operator = 'equals';
    const options: DatasourceOptions = {
      pageSize: 10,
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
  }, [tab.parentColumns, parent?.id]);

  const { records, loading, error, fetchMore, loaded } = useDatasource(tab.entityName, query);

  const columns = useMemo(() => parseColumns(Object.values(tab.fields)), [tab.fields]);

  const rowProps = useCallback(
    ({ row }: { row: MRT_Row<Record<string, unknown>> }) => ({
      onClick: () => {
        selectRecord(row.original as never, tab);
        row.toggleSelected();
      },
      onDoubleClick: () => {
        selectRecord(row.original as never, tab);
        navigate(`${windowId}/${tab.id}/${row.original.id}`);
      },
    }),
    [navigate, selectRecord, tab, windowId],
  );

  const handleBack = useCallback(() => setEditing(false), []);

  if (loading && !loaded) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;
  if (editing) {
    return (
      <Box maxHeight="50vh" overflow="auto">
        <Button variant="contained" onClick={handleBack}>
          Back
        </Button>
        <DynamicFormView record={selected[tab.level]} tab={tab} />
      </Box>
    );
  }

  return (
    <Box sx={sx.container}>
      <Box sx={sx.table}>
        <MaterialReactTable
          columns={columns}
          data={records}
          enableRowSelection
          enableMultiRowSelection
          positionToolbarAlertBanner="none"
          muiTableBodyRowProps={rowProps}
          enablePagination={false}
          renderBottomToolbar={tab.uIPattern == 'STD' ? <Button onClick={fetchMore}>Load more</Button> : null}
          initialState={initialState}
          enableTopToolbar={false}
          enableSorting={false}
          enableColumnFilters={false}
          enableColumnActions={false}
          muiTablePaperProps={muiTablePaperProps}
          muiTableHeadCellProps={muiTableHeadCellProps}
          muiTableBodyCellProps={muiTableBodyCellProps}
          muiTableBodyProps={muiTableBodyProps}
        />
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
