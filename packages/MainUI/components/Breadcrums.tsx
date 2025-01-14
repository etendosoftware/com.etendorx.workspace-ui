import React, { useCallback, useEffect, useMemo } from 'react';
import Breadcrumb from '@workspaceui/componentlibrary/src/components/Breadcrums';
import type { BreadcrumbItem } from '@workspaceui/componentlibrary/src/components/Breadcrums/types';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { styles } from './styles';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { BREADCRUMB, ROUTE_IDS } from '../constants/breadcrumb';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../hooks/useLanguage';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

const AppBreadcrumb: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const navigate = router.push;
  const { language } = useLanguage();

  const windowId = Array.isArray(params.windowId) ? params.windowId[0] : params.windowId || '';
  const recordId = Array.isArray(params.recordId) ? params.recordId[0] : params.recordId || '';

  const { windowData, load: loadWindow } = useWindow(windowId);

  const isNewRecord = useCallback(() => pathname.includes('/NewRecord'), [pathname]);

  const query = useMemo(
    () => ({
      criteria: [{ fieldName: 'id', operator: 'equals', value: recordId }],
    }),
    [recordId],
  );

  const { records, load: loadRecords } = useDatasource(windowData?.tabs?.[0]?.entityName || '', query);

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    if (windowId && windowData) {
      items.push({
        id: windowId,
        label: String(windowData.window$_identifier || windowData.name || t('common.loading')),
        onClick: () => navigate(`/window/${windowId}`),
      });
    }

    if (isNewRecord()) {
      items.push({
        id: ROUTE_IDS.NEW_RECORD,
        label: t('breadcrumb.newRecord'),
      });
    } else if (recordId && records && records.length > 0) {
      const record = records[0];
      items.push({
        id: recordId,
        label: String(record._identifier || record.documentNo || recordId),
      });
    }

    return items;
  }, [windowId, windowData, isNewRecord, recordId, records, navigate, t]);

  const handleHomeClick = useCallback(() => navigate('/'), [navigate]);

  useEffect(() => {
    if (windowId) {
      Metadata.setLanguage(language);
      loadWindow();
      if (recordId && windowData?.tabs?.[0]?.entityName) {
        loadRecords();
      }
    }
  }, [language, windowId, recordId, windowData?.tabs, loadWindow, loadRecords]);

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
