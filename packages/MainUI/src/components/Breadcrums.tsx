import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '@workspaceui/componentlibrary/components/Breadcrums';
import type { BreadcrumbItem } from '@workspaceui/componentlibrary/components/Breadcrums/types';
import { useWindow } from '@workspaceui/etendohookbinder/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/hooks/useDatasource';
import { styles } from './styles';

const AppBreadcrumb: React.FC = () => {
  const navigate = useNavigate();
  const { windowId, recordId } = useParams<{ windowId?: string; recordId?: string }>();

  const { windowData } = useWindow(windowId || '');

  const query = useMemo(
    () => ({
      criteria: [{ fieldName: 'id', operator: 'equals', value: recordId }],
    }),
    [recordId],
  );

  const { records } = useDatasource(windowData?.tabs[0]?.entityName || '', query);

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
  }, [windowId, recordId, windowData, records, navigate]);

  const handleHomeClick = () => navigate('/');

  return (
    <div style={styles.breadCrum}>
      <Breadcrumb items={breadcrumbItems} onHomeClick={handleHomeClick} homeText="Home" homeIcon="🏠" />
    </div>
  );
};
export default AppBreadcrumb;
