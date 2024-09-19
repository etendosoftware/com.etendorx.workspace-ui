import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { Outlet } from 'react-router-dom';
import Tabs from './Tabs';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';

export default function DynamicTableScreen() {
  const { loading, error, recordId, windowData, groupedTabs } =
    useMetadataContext();

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <div>{error?.message}</div>;
  } else if (recordId) {
    return <Outlet />;
  } else {
    return (
      <>
        {groupedTabs.map((tabs, index) => (
          <Tabs key={index} tabs={tabs} />
        ))}
      </>
    );
  }
}
