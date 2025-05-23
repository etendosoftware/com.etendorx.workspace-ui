import React from 'react';
import { Box } from '@mui/material';
import IconButton from '../../IconButton';
import { ToolbarSectionConfig } from '@workspaceui/storybook/src/stories/Components/Table/types';

const ToolbarSection: React.FC<ToolbarSectionConfig> = ({ buttons, style, isItemSelected }) => {
  return (
    <Box sx={style}>
      {buttons.map(({ key, icon, tooltip, onClick, disabled, ref, className, iconText }) => (
        <IconButton
          key={key}
          ref={ref}
          tooltip={tooltip}
          onClick={onClick}
          disabled={disabled || isItemSelected === false}
          className={className}
          iconText={iconText}>
          {icon}
        </IconButton>
      ))}
    </Box>
  );
};

export default ToolbarSection;
