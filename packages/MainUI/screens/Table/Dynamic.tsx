'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { TabLevel } from '../../components/TabLevel';

export default function WindowPage() {
  const params = useSearchParams();
  const allWindowIds = params.getAll('windowId');
  const [activeWindowId, setActiveWindowId] = useState<string | null>(params.get('active'));

  const { groupedTabs } = useMetadataContext();
  const renderedTabsRef = useRef(new Map<string, JSX.Element>());

  useEffect(() => {
    const newActive = params.get('active');
    if (newActive !== activeWindowId) {
      setActiveWindowId(newActive);
    }
  }, [params]);

  useEffect(() => {
    allWindowIds.forEach((id) => {
      if (!renderedTabsRef.current.has(id)) {
        const tabGroup = groupedTabs.find(group => group[0]?.windowId === id);
        const topTab = tabGroup?.find(t => t.level === 0);
        if (topTab) {
          renderedTabsRef.current.set(id, <TabLevel key={id} tab={topTab} />);
        }
      }
    });
  }, [allWindowIds, groupedTabs]);

  if (allWindowIds.length === 0 || !activeWindowId) {
    return <div>No hay ventanas activas.</div>;
  }

  const renderedTabs = Array.from(renderedTabsRef.current.entries());

  return (
    <>
      {renderedTabs.map(([id, component]) => (
        <div key={id} style={{ display: id === activeWindowId ? 'block' : 'none' }}>
          {component}
        </div>
      ))}
    </>
  );
}
