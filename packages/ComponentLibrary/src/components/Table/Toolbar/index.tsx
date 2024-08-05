import React from 'react';
import { Box } from '@mui/material';
import ToolbarSection from './ToolbarSection';
import { tableStyles } from '../styles';
import type { TopToolbarProps } from '../../../../../storybook/src/stories/Components/Table/types';

const TopToolbar: React.FC<TopToolbarProps> = ({
  leftSection,
  centerSection,
  rightSection,
  isItemSelected,
}) => {
  return (
    <Box sx={tableStyles.topToolbar}>
      <ToolbarSection {...leftSection} />
      <Box sx={tableStyles.topToolbarCenter}>
        <ToolbarSection {...centerSection} isItemSelected={isItemSelected} />
      </Box>
      <ToolbarSection {...rightSection} />
    </Box>
  );
};

export default TopToolbar;
