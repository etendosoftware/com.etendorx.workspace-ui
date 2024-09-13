import Box from '@mui/material/Box';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import IconButton from '../IconButton';
import { CircularProgress, Typography, useTheme } from '@mui/material';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import styles from './styles';
import { useEffect } from 'react';

type Params = Parameters<typeof useMaterialReactTable>[0];

export default function DynamicTable({
  columns,
  data,
  fetchMore,
  loading,
  tab,
}: {
  columns: Params['columns'];
  data: Params['data'];
  fetchMore: () => void;
  loading: boolean;
  tab: Record<string, unknown>;
}) {
  const theme = useTheme();
  const table = useMaterialReactTable({
    columns,
    data,
    enablePagination: false,
  });

  useEffect(() => {
    console.debug(tab)
  }, [tab]);

  return (
    <>
      <Box sx={styles.container}>
        <Box sx={styles.table}>
          <Typography>{tab._identifier}</Typography>
          <MaterialReactTable table={table} />
        </Box>
        <IconButton
          onClick={fetchMore}
          sx={styles.fetchMore}
          fill={theme.palette.baselineColor.neutral[80]}
          hoverFill={theme.palette.baselineColor.neutral[100]}>
          <ChevronDown />
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
