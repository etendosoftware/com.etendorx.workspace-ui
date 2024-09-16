import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { Outlet, useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import Tabs from './Tabs';
import {
  Tab,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';
import { useEffect, useMemo } from 'react';

export default function DynamicTableScreen() {
  const { id = '143', recordId = '' } = useParams();
  const { windowData, loading, error } = useWindow(id);

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <div>{error?.message}</div>;
  } else if (recordId) {
    return <Outlet />;
  } else {
    return <MultiTabs windowData={windowData} />;
  }
}

function MultiTabs({ windowData }: { windowData: WindowMetadata }) {
  const groupedTabs = useMemo(() => {
    const tabs: Record<string, Tab[]> = {};

    windowData.tabs.forEach(tab => {
      if (tabs[tab.level]) {
        tabs[tab.level].push(tab);
      } else {
        tabs[tab.level] = [tab];
      }
    });

    return tabs;
  }, [windowData]);

  useEffect(() => {
    console.debug(groupedTabs);
  }, [groupedTabs]);

  return (
    <>
      {Object.values(groupedTabs).map(v => (
        <Tabs tabs={v} />
      ))}
    </>
  );
}
