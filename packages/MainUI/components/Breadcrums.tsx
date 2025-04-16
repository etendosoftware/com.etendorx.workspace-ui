import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const navigate = router.push;

  const { window, recordId, windowId: currentWindowId } = useMetadataContext();
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);

  const isNewRecord = useCallback(() => pathname.includes('/NewRecord'), [pathname]);
  const isProcessOrReport = useMemo(() => pathname.includes('/process') || pathname.includes('/report'), [pathname]);

  const handleHomeClick = useCallback(() => navigate('/'), [navigate]);

  // Update open windows if metadata or route changes
  useEffect(() => {
    setOpenWindows(prev => {
      const updated = [...prev];
      const existingIndex = prev.findIndex(win => win.windowId === currentWindowId);

      if (currentWindowId && window) {
        const existing = prev[existingIndex];
        const hasSameName = existing?.windowData?.name === window.name;

        if (existing && hasSameName) return prev;
        if (existing) {
          updated[existingIndex] = { ...existing, windowData: window };
          return updated;
        }
        updated.push({ windowId: currentWindowId, windowData: window });
      }

      // Handle dynamic tabs for /process and /report routes
      if (isProcessOrReport && !prev.some(win => win.windowId === pathname)) {
        updated.push({ windowId: pathname, windowData: { name: pathname } });
      }

      return updated;
    });
  }, [currentWindowId, window, pathname, isProcessOrReport]);

  // Determine the currently active tab
  const activeTabId = useMemo(() => {
    if (isNewRecord()) return ROUTE_IDS.NEW_RECORD;
    return recordId || currentWindowId || 'home';
  }, [currentWindowId, recordId, isNewRecord]);

  // Remove tab and handle navigation
  const handleCloseTab = useCallback(
    (closedId: string) => {
      setOpenWindows(prev => {
        const index = prev.findIndex(win => win.windowId === closedId);
        const updated = prev.filter(win => win.windowId !== closedId);

        if (activeTabId === closedId) {
          const fallback = index > 0 ? prev[index - 1] : updated[0];
          navigate(fallback ? `/window/${fallback.windowId}` : '/');
        }

        return updated;
      });
    },
    [activeTabId, navigate]
  );

  // Build breadcrumb tab items
  const breadcrumbItems = useMemo(() => (
    openWindows.map(({ windowId, windowData }) => ({
      id: windowId,
      label: windowData?.name || t('common.loading'),
      onClick: () => {
        if (activeTabId !== windowId) {
          navigate(`/window/${windowId}`);
        }
      },
      onClose: () => handleCloseTab(windowId)
    }))
  ), [openWindows, activeTabId, navigate, t, handleCloseTab]);

  return (
    <div style={{ margin: '0 1rem' }}>
      <Breadcrumb
        items={breadcrumbItems}
        activeTabId={activeTabId}
        onHomeClick={handleHomeClick}
        homeText={t('breadcrumb.home')}
        homeIcon={BREADCRUMB.HOME.ICON}
      />
    </div>
  );
};

export default React.memo(AppBreadcrumb);
