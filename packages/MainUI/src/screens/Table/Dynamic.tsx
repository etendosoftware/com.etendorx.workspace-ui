import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import Tabs from './Tabs';
import { Box } from '@mui/material';
import { useMetadataContext } from '../../hooks/useMetadataContext';

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
