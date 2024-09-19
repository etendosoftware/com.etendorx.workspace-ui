import Box from '@mui/material/Box';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { CircularProgress, useTheme } from '@mui/material';
import styles from './styles';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { parseColumns } from '@workspaceui/etendohookbinder/src/helpers/metadata';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
export default function DynamicTable({
  tab,
  onSelect,
  onDoubleClick,
}: {
  tab: Tab;
  onSelect: (row: unknown) => void;
  onDoubleClick: (row: Record<string, string>) => void;
}) {
  const { records, loading, error, fetchMore, loaded } = useDatasource(tab);

  const theme = useTheme();

  const table = useMaterialReactTable({
    columns: parseColumns(Object.values(tab.fields)),
    data: records,
    enablePagination: false,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => onSelect(row.original),
      onDoubleClick: () => onDoubleClick(row.original),
    }),
  });

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
            sx={styles.fetchMore}
            fill={theme.palette.baselineColor.neutral[80]}
            hoverFill={theme.palette.baselineColor.neutral[100]}>
            +
          </IconButton>
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
