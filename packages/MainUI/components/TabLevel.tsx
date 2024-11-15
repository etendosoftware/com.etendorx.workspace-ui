'use client';

import { Toolbar } from './Toolbar';
import DynamicTable from './Table';
import { styles } from './styles';
import { TabLevelProps } from './types';

export function TabLevel({ tab }: Omit<TabLevelProps, 'level'>) {
  return (
    <div className={`tab-level-${tab.level}`}>
      <div style={styles.box}>
        <Toolbar windowId={tab.windowId} tabId={tab.id} />
      </div>
      <DynamicTable tab={tab} />
    </div>
  );
}
