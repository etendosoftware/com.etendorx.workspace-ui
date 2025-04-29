'use client';

import { Toolbar } from './Toolbar/Toolbar';
import DynamicTable from './Table';
import { TabLevelProps } from './types';
import { SearchProvider, useSearch } from '../contexts/searchContext';
import { useMemo } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { DatasourceOptions, EntityData } from '@workspaceui/etendohookbinder/src/api/types';
import { parseColumns } from '@/utils/tableColumns';
import { useLanguage } from '@/contexts/language';
import TabContextProvider from '@/contexts/tab';

export function TabLevel({ tab }: Omit<TabLevelProps, 'level'>) {
  const { language } = useLanguage();
  const { searchQuery } = useSearch();
  const parent = { id: '' } as EntityData;
  const columns = useMemo(() => parseColumns(Object.values(tab.fields)), [tab.fields]);

  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0] || 'id';
    const value = parent?.id || '';
    const operator = 'equals';

    const options: DatasourceOptions = {
      windowId: tab.windowId,
      tabId: tab.id,
      isImplicitFilterApplied: tab.hqlfilterclause?.length > 0 || tab.sQLWhereClause?.length > 0,
      pageSize: 100,
      language,
    };

    if (value) {
      options.criteria = [
        {
          fieldName,
          value,
          operator,
        },
      ];
    }

    return options;
  }, [language, parent?.id, tab]);

  const { refetch, ...others } = useDatasource(tab.entityName, query, searchQuery, columns);

  return (
    <SearchProvider>
      <TabContextProvider tab={tab}>
        <div className={`tab-level-${tab.level} flex flex-col min-h-0 flex-auto mx-1 pb-1 max-h-full`}>
          <div className="mb-2 ">
            <Toolbar windowId={tab.windowId} tabId={tab.id} onRefresh={refetch} />
          </div>
          <div className="min-h-0 flex-auto overflow-auto">
            <DynamicTable refetch={refetch} tab={tab} {...others} />
          </div>
        </div>
      </TabContextProvider>
    </SearchProvider>
  );
}
