import Box from '@mui/material/Box';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { CircularProgress } from '@mui/material';
import styles from './styles';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { parseColumns } from '@workspaceui/etendohookbinder/src/helpers/metadata';
import { useRecordContext } from '../../hooks/useRecordContext';
import { useTableRecords } from '../../hooks/useTableRecords';

export default function DynamicTable({
  tab,
  onSelect,
  onDoubleClick,
}: {
  tab: Tab;
  onSelect: (row: unknown) => void;
  onDoubleClick: (row: Record<string, string>) => void;
}) {
  const { records, loading, error, fetchMore, loaded } = useTableRecords(tab);
  const { selected } = useRecordContext();
  const enabled = tab.level <= selected.length;

  const table = useMaterialReactTable({
    columns: parseColumns(Object.values(tab.fields)),
    data: records,
    enablePagination: false,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => onSelect(row.original),
      onDoubleClick: () => onDoubleClick(row.original),
    }),
  });

  if (!enabled) {
    return null;
  }

  if (loading && !loaded) {
    return <Spinner />;
  } else if (error) {
    return <div>{error.message}</div>;
  } else {
    return (
      <>
        <Box sx={styles.container}>
          <Box sx={styles.table}>
            <MaterialReactTable table={table} />
          </Box>
          <IconButton
            onClick={fetchMore}
            iconText='+'
            sx={styles.fetchMore} />
        </Box>
        {loading ? (
          <Box sx={styles.loader}>
            <CircularProgress />
          </Box>
        ) : null}
      </>
    );
  }
}
