'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { TabLevel } from '../../components/TabLevel';

export default function WindowPage() {
  const params = useSearchParams();
  const initialWindowIds = params.getAll('windowId');
  const initialActive = params.get('active');

  const [windowIds, setWindowIds] = useState<string[]>(initialWindowIds);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(initialActive);
  const renderedTabsRef = useRef<Map<string, JSX.Element>>(new Map());
  const [_, forceUpdate] = useState(0);

  useEffect(() => {
    setWindowIds(params.getAll('windowId'));
    setActiveWindowId(params.get('active'));
  }, [params]);

  useEffect(() => {
    const fetchTabs = async () => {
      for (const id of windowIds) {
        if (renderedTabsRef.current.has(id)) continue;

        try {
          const metadata = await Metadata.getWindow(id);
          const topTab = metadata.tabs?.find(t => t.level === 0);
          if (topTab) {
            renderedTabsRef.current.set(id, <TabLevel key={id} tab={topTab} />);
            forceUpdate(n => n + 1);
          }
        } catch (err) {
          console.warn(`${id}`, err);
        }
      }
    };

    fetchTabs();
  }, [windowIds]);

  if (windowIds.length === 0 || !activeWindowId) {
    return <div>No hay ventanas activas.</div>;
  }

  return (
    <>
      {Array.from(renderedTabsRef.current.entries()).map(([id, element]) => (
        <div key={id} style={{ display: id === activeWindowId ? 'block' : 'none' }}>
          {element}
        </div>
      ))}
    </>
  );
}
