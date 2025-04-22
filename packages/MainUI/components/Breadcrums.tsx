'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Breadcrumb from '@workspaceui/componentlibrary/src/components/Breadcrums';
import { BREADCRUMB, ROUTE_IDS } from '../constants/breadcrumb';
import { useTranslation } from '../hooks/useTranslation';
import { useMetadataContext } from '../hooks/useMetadataContext';

interface OpenWindow {
  windowId: string;
  windowData: any;
}

const AppBreadcrumb: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const { window: currentWindowData, recordId, windowId: currentWindowId } = useMetadataContext();
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);

  const isNewRecord = useCallback(() => pathname.includes('/NewRecord'), [pathname]);
  const isProcessOrReport = useMemo(
    () => pathname.includes('/process') || pathname.includes('/report'),
    [pathname]
  );

  useEffect(() => {
    setOpenWindows(prev => {
      const updated = [...prev];
      const idx = prev.findIndex(w => w.windowId === currentWindowId);
      if (currentWindowId && currentWindowData) {
        const exists = prev[idx];
        if (exists && exists.windowData.name === currentWindowData.name) return prev;
        if (exists) {
          updated[idx] = { windowId: currentWindowId, windowData: currentWindowData };
        } else {
          updated.push({ windowId: currentWindowId, windowData: currentWindowData });
        }
      }
      if (isProcessOrReport && !prev.some(w => w.windowId === pathname)) {
        updated.push({ windowId: pathname, windowData: { name: pathname } });
      }
      return updated;
    });
  }, [currentWindowId, currentWindowData, pathname, isProcessOrReport]);

  const activeTabId = useMemo(() => {
    if (isNewRecord()) return ROUTE_IDS.NEW_RECORD;
    return recordId || currentWindowId || 'home';
  }, [currentWindowId, recordId, isNewRecord]);

  const searchParams = useSearchParams();

  const normalizeId = (id: string) => {
    return id.replace(/^\/?window\/?/, '');
  };

  const handleTabChangeUrl = useCallback(
    (newIdRaw: string) => {
      const newId = normalizeId(newIdRaw);
      const params = new URLSearchParams(searchParams.toString());

      const cleanedWindowIds = params
        .getAll('windowId')
        .map(normalizeId)
        .filter((id, index, self) => id && self.indexOf(id) === index);

      if (!cleanedWindowIds.includes(newId)) {
        cleanedWindowIds.push(newId);
      }

      params.delete('windowId');
      cleanedWindowIds.forEach(id => params.append('windowId', id));
      params.set('active', newId);

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/window?${params.toString()}`);
      }
    },
    [searchParams]
  );

  const handleCloseTab = useCallback(
    (closedId: string) => {
      setOpenWindows(prev => prev.filter(w => w.windowId !== closedId));
      const params = new URLSearchParams(window.location.search);
      const keep = params.getAll('windowId').filter(id => id !== closedId);
      params.delete('windowId');
      keep.forEach(id => params.append('windowId', id));
      const active = params.get('active');
      if (active === closedId) {
        const fallback = keep.at(-1);
        if (fallback) params.set('active', fallback);
        else params.delete('active');
      }
      router.push(`/window?${params.toString()}`);
    },
    [router]
  );

  const breadcrumbItems = useMemo(
    () =>
      openWindows.map(({ windowId, windowData }) => ({
        id: windowId,
        label: windowData.name || t('common.loading'),
        onClick: () => handleTabChangeUrl(windowId),
        onClose: () => handleCloseTab(windowId),
      })),
    [openWindows, t, handleTabChangeUrl, handleCloseTab]
  );

  const handleHomeClick = useCallback(() => router.push('/'), [router]);

  return (
    <div style={{ margin: '0 1rem' }}>
      <Breadcrumb
        items={breadcrumbItems}
        activeTabId={activeTabId}
        onHomeClick={handleHomeClick}
        onTabChange={handleTabChangeUrl}
        homeText={t('breadcrumb.home')}
        homeIcon={BREADCRUMB.HOME.ICON}
      />
    </div>
  );
};

export default React.memo(AppBreadcrumb);
