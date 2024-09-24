import Box from '@mui/material/Box';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import styles from './styles';
import type {
  DatasourceOptions,
  Tab,
} from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { parseColumns } from '@workspaceui/etendohookbinder/src/helpers/metadata';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import useIsEnabled from '../../hooks/useIsEnabled';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';

type DynamicTableProps = {
  tab: Tab;
};

const DynamicTableContent = ({ tab }: DynamicTableProps) => {
  const { selected, selectRecord } = useMetadataContext();
  const navigate = useNavigate();
  const parent = selected[tab.level - 1];

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0];
    const value = parent?.id || '';

    return value
      ? {
          criteria: [
            {
              fieldName,
              value,
              operator: 'equals',
            },
          ],
        }
      : {};
  }, [tab.parentColumns, parent?.id]);

  const { records, loading, error, fetchMore, loaded } = useDatasource(
    tab,
    query,
  );

  const table = useMaterialReactTable({
    columns: parseColumns(Object.values(tab.fields)),
    data: records,
    enablePagination: false,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => selectRecord(row.original, tab),
      onDoubleClick: () => {
        selectRecord(row.original, tab);
        navigate(`${row.original.id}`);
      },
    }),
  });

  if (loading && !loaded) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Box sx={styles.container}>
      <Box sx={styles.table}>
        <MaterialReactTable table={table} />
      </Box>
      <IconButton onClick={fetchMore} iconText="+" sx={styles.fetchMore} />
    </Box>
  );
};

const DynamicTable = ({ tab }: DynamicTableProps) => {
  const enabled = useIsEnabled(tab);
  return enabled ? <DynamicTableContent tab={tab} /> : null;
};

export default DynamicTable;
