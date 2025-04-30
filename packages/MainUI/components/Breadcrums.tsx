import React, { useCallback, useMemo } from 'react';
import Breadcrumb from '@workspaceui/componentlibrary/src/components/Breadcrums';
import type { BreadcrumbItem } from '@workspaceui/componentlibrary/src/components/Breadcrums/types';
import { styles } from './styles';
import { useRouter, usePathname } from 'next/navigation';
import { BREADCRUMB, ROUTE_IDS } from '../constants/breadcrumb';
import { useTranslation } from '../hooks/useTranslation';
import { useMetadataContext } from '../hooks/useMetadataContext';

const AppBreadcrumb: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const navigate = router.push;
  const { window, recordId, windowId, selected } = useMetadataContext();

  const isNewRecord = useCallback(() => pathname.includes('/NewRecord'), [pathname]);

  const recordIdentifier = useMemo(() => {
    if (selected[0]?._identifier && selected[0]._identifier !== recordId) {
      return selected[0]._identifier;
    }

    return recordId;
  }, [recordId, selected]);

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    if (windowId && window) {
      items.push({
        id: windowId,
        label: String(window.window$_identifier || window.name || t('common.loading')),
        onClick: () => null,
      });
    }

    if (isNewRecord()) {
      items.push({
        id: ROUTE_IDS.NEW_RECORD,
        label: t('breadcrumb.newRecord'),
      });
    } else if (recordId) {
      items.push({
        id: recordId,
        label: String(recordIdentifier),
      });
    }

    return items;
  }, [windowId, window, isNewRecord, recordId, recordIdentifier, t]);

  const handleHomeClick = useCallback(() => navigate('/'), [navigate]);

  return (
    <div style={styles.breadCrum}>
      <Breadcrumb
        items={breadcrumbItems}
        onHomeClick={handleHomeClick}
        homeText={t('breadcrumb.home')}
        homeIcon={BREADCRUMB.HOME.ICON}
      />
    </div>
  );
};

export default AppBreadcrumb;
