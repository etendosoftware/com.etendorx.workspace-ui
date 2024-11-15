import React, { useCallback, useMemo } from 'react';
import Breadcrumb from '@workspaceui/componentlibrary/src/components/Breadcrums';
import type { BreadcrumbItem } from '@workspaceui/componentlibrary/src/components/Breadcrums/types';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { styles } from './styles';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { BREADCRUMB } from '../constants/breadcrumb';

const AppBreadcrumb: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const navigate = router.push;

  const windowId = Array.isArray(params.windowId) ? params.windowId[0] : params.windowId || '';
  const recordId = Array.isArray(params.recordId) ? params.recordId[0] : params.recordId || '';

  const { windowData } = useWindow(windowId);

  const isNewRecord = useCallback(() => {
    const pathIncludesNew = pathname.includes('/NewRecord');
    return pathIncludesNew;
  }, [pathname]);

  const query = useMemo(
    () => ({
      criteria: [{ fieldName: 'id', operator: 'equals', value: recordId }],
    }),
    [recordId],
  );

  const { records } = useDatasource(windowData?.tabs?.[0]?.entityName || '', query);

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    if (windowId && windowData) {
      items.push({
        id: windowId,
        label: String(windowData.window$_identifier || windowData.name || BREADCRUMB.LOADING.LABEL),
        onClick: () => navigate(`/window/${windowId}`),
      });
    }

    if (isNewRecord()) {
      items.push({
        id: BREADCRUMB.NEW_RECORD.ID,
        label: BREADCRUMB.NEW_RECORD.LABEL,
      });
    } else if (recordId && records && records.length > 0) {
      const record = records[0];
      items.push({
        id: recordId,
        label: String(record._identifier || record.documentNo || recordId),
      });
    }

    return items;
  }, [windowId, windowData, isNewRecord, recordId, records, navigate]);

  const handleHomeClick = useCallback(() => navigate('/'), [navigate]);

  return (
    <div style={styles.breadCrum}>
      <Breadcrumb
        items={breadcrumbItems}
        onHomeClick={handleHomeClick}
        homeText={BREADCRUMB.HOME.TEXT}
        homeIcon={BREADCRUMB.HOME.ICON}
      />
    </div>
  );
};

export default AppBreadcrumb;
