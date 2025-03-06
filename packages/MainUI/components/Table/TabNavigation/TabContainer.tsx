import React from 'react';
import { Box } from '@mui/material';
import TabContent from './TabContent';
import { TabProps } from './types';

const TabContainer: React.FC<TabProps> = ({ onClose, selectedRecord, tab, handleFullSize, isFullSize }) => {
  const safeRecord = selectedRecord || { identifier: '', type: '' };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TabContent
        onClose={onClose}
        identifier={safeRecord.identifier || ''}
        type={safeRecord.type || ''}
        handleFullSize={handleFullSize}
        isFullSize={isFullSize}
        tab={tab}
        selectedRecord={safeRecord}
      />
    </Box>
  );
};

export default TabContainer;
