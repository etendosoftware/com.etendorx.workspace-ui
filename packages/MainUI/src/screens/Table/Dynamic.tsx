import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import Tabs from './Tabs';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';

export default function DynamicTableScreen() {
  const { loading, error, windowData, groupedTabs } = useMetadataContext();

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <div>{error?.message}</div>;
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
