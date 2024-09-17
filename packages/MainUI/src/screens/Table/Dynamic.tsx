import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { Outlet, useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import Tabs from './Tabs';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo } from 'react';

export default function DynamicTableScreen() {
  const { id = '143', recordId = '' } = useParams();
  const { windowData, loading, error } = useWindow(id);

  const groupedTabs = useMemo(() => {
    const tabs: Record<string, Tab[]> = {};

    windowData?.tabs.forEach(tab => {
      if (tabs[tab.level]) {
        tabs[tab.level].push(tab);
      } else {
        tabs[tab.level] = [tab];
      }
    });

    return Object.keys(tabs)
      .sort()
      .map(k => tabs[k]);
  }, [windowData]);

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <div>{error?.message}</div>;
  } else if (recordId) {
    return <Outlet />;
  } else {
    return (
      <>
        {groupedTabs.map(tab => (
          <Tabs tabs={tab} />
        ))}
      </>
    );
  }
}
