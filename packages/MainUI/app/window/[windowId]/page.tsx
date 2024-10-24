'use client';

import { Box } from '@mui/material';
import { Tab } from '@workspaceui/etendohookbinder/api/types';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import Tabs from '../../../screens/Table/Tabs';
import { useMetadataContext } from '../../../hooks/useMetadataContext';

function Level(value: Tab[]) {
  return <Tabs key={value[0].id} tabs={value} />;
}

export default function DynamicTableScreen() {
  const { loading, error, windowData, groupedTabs } = useMetadataContext();

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <Box p={1}>{error?.message ?? 'Something went wrong'}</Box>;
  } else {
    return <div>{groupedTabs.map(Level)}</div>;
  }
}
