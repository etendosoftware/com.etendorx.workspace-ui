import { Box } from '@mui/material';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import Tabs from './Tabs';

function TabView(value: Tab[]) {
  return <Tabs key={value[0].id} tabs={value} />;
}

export default function DynamicTableScreen() {
  const { error, groupedTabs } = useMetadataContext();

  if (error) {
    return <Box p={1}>{error?.message ?? 'Something went wrong'}</Box>;
  } else {
    return <div>{groupedTabs.map(TabView)}</div>;
  }
}
