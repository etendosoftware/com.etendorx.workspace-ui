import Box from '@mui/material/Box';
import { MaterialReactTable, MRT_Row } from 'material-react-table';
import styles from './styles';
import type { DatasourceOptions, Tab } from '@workspaceui/etendohookbinder/api/types';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import { useNavigate } from 'react-router-dom';
import { memo, useCallback, useMemo } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/hooks/useDatasource';
import { Button } from '@workspaceui/componentlibrary/components';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { parseColumns } from '../../utils/metadata';

type DynamicTableProps = {
  tab: Tab;
};

const DynamicTableContent = memo(function DynamicTableContent({ tab }: DynamicTableProps) {
  const { selected, selectRecord } = useMetadataContext();
  const navigate = useNavigate();
  const parent = selected[tab.level - 1];

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0] || 'id';
    const value = parent?.id || '';
    const operator = 'equals';

    return value
      ? {
          criteria: [
            {
              fieldName,
              value,
              operator,
            },
          ],
        }
      : {};
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
        navigate(`${row.original.id}`);
      },
    }),
    [navigate, selectRecord, tab],
  );

  if (loading && !loaded) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Box sx={styles.container}>
      <Box sx={styles.table}>
        <MaterialReactTable
          columns={columns}
          data={records}
          enableRowSelection
          enableMultiRowSelection={false}
          positionToolbarAlertBanner="none"
          muiTableBodyRowProps={rowProps}
          enablePagination={false}
          renderBottomToolbar={tab.uIPattern == 'STD' ? <Button onClick={fetchMore}>Load more</Button> : null}
        />
      </Box>
    </Box>
  );
});

const DynamicTable = ({ tab }: DynamicTableProps) => {
  const { selected } = useMetadataContext();

  if (selected[tab.level - 1] || tab.level === 0) {
    return tab.uIPattern == 'STD' ? <DynamicTableContent tab={tab} /> : <DynamicTableContent tab={tab} />;
  }

  return null;
};

export default DynamicTable;
