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
import { useTabDatasource } from '../../hooks/useTabDatasource';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import useIsEnabled from '../../hooks/useIsEnabled';

type DynamicTableProps = {
  tab: Tab;
};

function DynamicTableContent({ tab }: DynamicTableProps) {
  const { selected, selectedTab, selectRecord } = useMetadataContext();
  const navigate = useNavigate();
  const parent = selected[tab.level - 1];
  const parentTab = selectedTab[tab.level - 1];

  useEffect(() => {
    console.debug({ parent, parentTab });
  }, [parent, parentTab]);

  const query: DatasourceOptions = useMemo(() => {
    if (tab.parentColumns.length) {
      return {
        criteria: [
          {
            fieldName: tab.parentColumns[0] ?? '',
            operator: 'equals',
            value: parent?.id ?? '',
          },
        ],
      };
    } else {
      return {};
    }
  }, [tab.parentColumns, parent?.id]);

  const { records, loading, error, fetchMore, loaded } = useTabDatasource(
    tab,
    query,
  );

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
  } else {
    return (
      <Box sx={styles.container}>
        <Box sx={styles.table}>
          <MaterialReactTable table={table} />
        </Box>
        <IconButton onClick={fetchMore} iconText="+" sx={styles.fetchMore} />
      </Box>
    );
  }
}

export default function DynamicTable({ tab }: DynamicTableProps) {
  const enabled = useIsEnabled(tab);

  if (enabled) {
    return <DynamicTableContent tab={tab} />;
  } else {
    return null;
  }
}
