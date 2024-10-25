import React, { useCallback, useMemo } from 'react';
import Breadcrumb from '@workspaceui/componentlibrary/components/Breadcrums';
import type { BreadcrumbItem } from '@workspaceui/componentlibrary/components/Breadcrums/types';
import { useWindow } from '@workspaceui/etendohookbinder/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/hooks/useDatasource';
import { styles } from './styles';
import { useRouter, useParams } from 'next/navigation';

const homeIcon = '🏠';

const AppBreadcrumb: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const navigate = router.push;

  const windowId = Array.isArray(params.windowId) ? params.windowId[0] : params.windowId || '';
  const recordId = Array.isArray(params.recordId) ? params.recordId[0] : params.recordId || '';

  const { windowData } = useWindow(windowId);

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
        label: String(windowData.window$_identifier || windowData.name || 'Loading...'),
        onClick: () => navigate(`/window/${windowId}`),
      });
    }

    if (recordId && records && records.length > 0) {
      const record = records[0];
      items.push({
        id: recordId,
        label: String(record._identifier || record.documentNo || recordId),
      });
    }

    return items;
  }, [windowData, records, navigate, windowId, recordId]);

  const handleHomeClick = useCallback(() => navigate('/'), [navigate]);

  return (
    <div style={styles.breadCrum}>
      <Breadcrumb items={breadcrumbItems} onHomeClick={handleHomeClick} homeText="Home" homeIcon={homeIcon} />
    </div>
  );
};

export default AppBreadcrumb;
