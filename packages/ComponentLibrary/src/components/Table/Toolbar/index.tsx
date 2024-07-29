import React from 'react';
import { Box } from '@mui/material';
import LeftSection from './LeftSection';
import CenterSection from './CenterSection';
import RightSection from './RightSection';
import { tableStyles } from '../styles';
import { TopToolbarProps } from '../../../../../storybook/src/stories/Components/Table/types';

const TopToolbar: React.FC<TopToolbarProps> = ({
  table,
  isDropdownOpen,
  toggleDropdown,
  isItemSelected,
}) => {
  return (
    <Box sx={tableStyles.topToolbar}>
      <LeftSection onNewLineClick={() => {}} onChevronClick={() => {}} />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-start',
          marginLeft: '1rem',
        }}>
        <CenterSection isItemSelected={isItemSelected} />
      </Box>
      <RightSection
        table={table}
        isDropdownOpen={isDropdownOpen}
        toggleDropdown={toggleDropdown}
      />
    </Box>
  );
};

export default TopToolbar;
