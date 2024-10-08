import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import Tabs from './Tabs';
import { useMetadataContext } from '@workspaceui/etendohookbinder/hooks/useMetadataContext';
import { Box } from '@mui/material';

export default function DynamicTableScreen() {
  const { loading, error, windowData, groupedTabs } = useMetadataContext();

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <Box p={1}>{error?.message ?? 'Something went wrong'}</Box>;
  } else {
    return (
      <div>
        {groupedTabs.map((tabs, index) => (
          <Tabs key={index} tabs={tabs} />
        ))}
      </div>
    );
  }
}
