import React from 'react';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { TabLevel } from '../../components/TabLevel';

export default function DynamicTableScreen() {
  const { loading, error, windowData, groupedTabs } = useMetadataContext();

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <div className="p-4 text-error-main">{error?.message ?? 'Something went wrong'}</div>;
  } else {
    const topLevelTabs = groupedTabs.find(tabs => tabs[0].level === 0) || [];

    return (
      <div className="m-1 relative h-screen overflow-hidden bg-baseline-0">
        {topLevelTabs.length > 0 && <TabLevel tab={topLevelTabs[0]} />}
      </div>
    );
  }
}
