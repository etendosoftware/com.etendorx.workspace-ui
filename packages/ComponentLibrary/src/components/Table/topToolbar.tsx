import React from 'react';
import { Box } from '@mui/material';
import { MRT_TableInstance } from 'material-react-table';
import LeftSection from './sections/LeftSection';
import CenterSection from './sections/CenterSection';
import RightSection from './sections/RightSection';
import { tableStyles } from './styles';
import { Organization } from './types';

interface TopToolbarProps {
  table: MRT_TableInstance<Organization>;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  table,
  isFullScreen,
  toggleFullScreen,
}) => {
  return (
    <Box sx={tableStyles.topToolbar}>
      <LeftSection />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-start',
          marginLeft: '1rem',
        }}>
        <CenterSection />
      </Box>
      <RightSection
        table={table}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
      />
    </Box>
  );
};

export default TopToolbar;
