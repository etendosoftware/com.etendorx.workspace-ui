import React from 'react';
import TabContent from './TabContent';
import { TabProps } from './types';

const TabContainer: React.FC<TabProps> = ({ onClose, selectedRecord, tab, handleFullSize, isFullSize }) => {
  const safeRecord = selectedRecord || { identifier: '', type: '' };

  return (
    <div className="w-full h-full flex flex-col">
      <TabContent
        onClose={onClose}
        identifier={String(safeRecord.identifier || '')}
        type={String(safeRecord.type || '')}
        handleFullSize={handleFullSize}
        isFullSize={isFullSize}
        tab={tab}
        selectedRecord={safeRecord}
      />
    </div>
  );
};

export default React.memo(TabContainer);
