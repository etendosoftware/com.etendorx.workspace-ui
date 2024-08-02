import React from 'react';
import { Box } from '@mui/material';
import IconButton from '../../IconButton';
import { ToolbarSectionConfig } from '../../../../../storybook/src/stories/Components/Table/types';

const ToolbarSection: React.FC<ToolbarSectionConfig> = ({
  buttons,
  style,
  isItemSelected,
}) => {
  return (
    <Box sx={style}>
      {buttons.map(
        ({
          key,
          icon,
          tooltip,
          onClick,
          disabled,
          fill,
          hoverFill,
          width,
          height,
          sx,
        }) => (
          <IconButton
            key={key}
            tooltip={tooltip}
            onClick={onClick}
            disabled={disabled || isItemSelected === false}
            fill={fill}
            hoverFill={hoverFill}
            width={width}
            height={height}
            sx={sx}>
            {icon}
          </IconButton>
        ),
      )}
    </Box>
  );
};
export default ToolbarSection;
