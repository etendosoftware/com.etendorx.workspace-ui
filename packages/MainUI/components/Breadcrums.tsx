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
  const { window } = useMetadataContext();

  const isNewRecord = useCallback(() => pathname.includes('/NewRecord'), [pathname]);

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    if (window) {
      items.push({
        id: window.id,
        label: String(window.window$_identifier || window.name || t('common.loading')),
        onClick: () => navigate(`/window/${window.id}`),
      });
    }

    if (isNewRecord()) {
      items.push({
        id: ROUTE_IDS.NEW_RECORD,
        label: t('breadcrumb.newRecord'),
      });
    }

    return items;
  }, [isNewRecord, navigate, t, window]);

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
