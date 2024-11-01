import React from 'react';
import { Box } from '@mui/material';
import ToolbarSection from './ToolbarSection';
import { useStyle } from '../styles';
import type { TopToolbarProps } from '../../../../../storybook/src/stories/Components/Table/types';

const TopToolbar: React.FC<TopToolbarProps> = ({ leftSection, centerSection, rightSection, isItemSelected }) => {
  const { sx } = useStyle();

  return (
    <Box sx={sx.topToolbar}>
      <ToolbarSection {...leftSection} />
      <Box sx={sx.topToolbarCenter}>
        <ToolbarSection {...centerSection} isItemSelected={isItemSelected} />
      </Box>
      <ToolbarSection {...rightSection} />
    </Box>
  );
};

export default TopToolbar;
