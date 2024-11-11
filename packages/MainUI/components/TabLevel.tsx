'use client';

import { Toolbar } from './Toolbar';
import DynamicTable from './Table';
import { styles } from './styles';
import { TabLevelProps } from './types';

export function TabLevel({ tab, level }: TabLevelProps) {
  return (
    <div className={`tab-level-${level}`}>
      <div style={styles.box}>
        <Toolbar windowId={tab.windowId} tabId={tab.id} />
      </div>
      <DynamicTable tab={tab} />
    </div>
  );
}
