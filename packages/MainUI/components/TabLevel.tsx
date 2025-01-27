'use client';

import { Toolbar } from './Toolbar/Toolbar';
import DynamicTable from './Table';
import { styles } from './styles';
import { TabLevelProps } from './types';
import { SearchProvider } from '../contexts/searchContext';

export function TabLevel({ tab }: Omit<TabLevelProps, 'level'>) {
  return (
    <SearchProvider>
      <div className={`tab-level-${tab.level}`}>
        <div style={styles.box}>
          <Toolbar windowId={tab.windowId} tabId={tab.id} />
        </div>
        <DynamicTable tab={tab} />
      </div>
    </SearchProvider>
  );
}
