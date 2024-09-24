import Box from '@mui/material/Box';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import styles from './styles';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { parseColumns } from '@workspaceui/etendohookbinder/src/helpers/metadata';
import { useTabDatasource } from '../../hooks/useTabDatasource';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import { useNavigate } from 'react-router-dom';

export default function DynamicTable({ tab }: { tab: Tab }) {
  const { records, loading, error, fetchMore, loaded } = useTabDatasource(tab);
  const { selected, parentTab } = useMetadataContext();
  const enabled = tab.level <= selected.length;

  if (parentTab !== tab) {
    console.debug({ parentTab, tab });
  }

  const { selectRecord } = useMetadataContext();
  const navigate = useNavigate();

  const table = useMaterialReactTable({
    columns: parseColumns(Object.values(tab.fields)),
    data: records,
    enablePagination: false,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        selectRecord(row.original, tab);
      },
      onDoubleClick: () => {
        selectRecord(row.original, tab);
        navigate(`${row.original.id}`);
      },
    }),
  });

  if (loading && !loaded) {
    return <Spinner />;
  } else if (error) {
    return <div>{error.message}</div>;
  } else if (enabled) {
    return (
      <Box sx={styles.container}>
        <Box sx={styles.table}>
          <MaterialReactTable table={table} />
        </Box>
        <IconButton onClick={fetchMore} iconText="+" sx={styles.fetchMore} />
      </Box>
    );
  } else {
    return null;
  }
}
