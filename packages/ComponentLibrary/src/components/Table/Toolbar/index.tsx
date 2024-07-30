import React from 'react';
import { Box } from '@mui/material';
import ToolbarSection from './ToolbarSection';
import { tableStyles } from '../styles';
import { TopToolbarProps } from '../../../../../storybook/src/stories/Components/Table/types';

const TopToolbar: React.FC<TopToolbarProps> = ({
  leftSection,
  centerSection,
  rightSection,
  isItemSelected,
}) => {
  return (
    <Box
      sx={{
        ...tableStyles.topToolbar,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
      <ToolbarSection {...leftSection} />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-start',
          marginLeft: '1rem',
        }}>
        <ToolbarSection {...centerSection} isItemSelected={isItemSelected} />
      </Box>
      <ToolbarSection {...rightSection} />
    </Box>
  );
};

export default TopToolbar;
