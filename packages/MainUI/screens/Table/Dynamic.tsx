import { Box } from '@mui/material';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { TabLevel } from '../../components/TabLevel';

export default function DynamicTableScreen() {
  const { loading, error, windowData, groupedTabs } = useMetadataContext();

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <Box p={1}>{error?.message ?? 'Something went wrong'}</Box>;
  } else {
    const topLevelTabs = groupedTabs.find(tabs => tabs[0].level === 0) || [];
    return (
      <Box margin={'0.25rem'}>
        <TabLevel tab={topLevelTabs[0]} />
      </Box>
    );
  }
}
