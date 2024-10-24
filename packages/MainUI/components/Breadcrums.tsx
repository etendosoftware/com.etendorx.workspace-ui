import React, { useCallback, useMemo } from 'react';
import Breadcrumb from '@workspaceui/componentlibrary/components/Breadcrums';
import type { BreadcrumbItem } from '@workspaceui/componentlibrary/components/Breadcrums/types';
import { useWindow } from '@workspaceui/etendohookbinder/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/hooks/useDatasource';
import { styles } from './styles';
import { useRouter } from 'next/navigation';

const homeIcon = '🏠';

const { windowId, recordId } = { recordId: '', windowId: '' };

const AppBreadcrumb: React.FC = () => {
  const router = useRouter();
  const navigate = router.push;

  const { windowData } = useWindow(windowId || '');

  const query = useMemo(
    () => ({
      criteria: [{ fieldName: 'id', operator: 'equals', value: recordId }],
    }),
    [],
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
  }, [windowData, records, navigate]);

  const handleHomeClick = useCallback(() => navigate('/'), [navigate]);

  return (
    <div style={styles.breadCrum}>
      <Breadcrumb items={breadcrumbItems} onHomeClick={handleHomeClick} homeText="Home" homeIcon={homeIcon} />
    </div>
  );
};
export default AppBreadcrumb;
