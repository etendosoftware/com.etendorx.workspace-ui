import React, { useState } from 'react';
import { Tooltip, IconButton as MUIIconButton } from '@mui/material';
import { theme } from '../../theme';
import { defaultStyles } from './styles';
import { IIconComponentProps } from './types';

const IconButton: React.FC<IIconComponentProps> = ({
  fill = theme.palette.baselineColor.neutral[80],
  hoverFill = theme.palette.baselineColor.neutral[0],
  width = 24,
  height = 24,
  tooltip,
  sx,
  children,
  ...props
}) => {
  const [iconFill, setIconFill] = useState<string>(fill);

  const handleMouseEnter = () => setIconFill(hoverFill);
  const handleMouseLeave = () => setIconFill(fill);

  const combinedStyles = {
    ...defaultStyles,
    ...sx,
  };

  const clonedIcon = React.cloneElement(children as React.ReactElement, {
    style: { fill: iconFill, width, height },
  });

  return (
    <Tooltip title={tooltip ?? ''} arrow>
      <MUIIconButton
        sx={combinedStyles}
        {...props}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        {clonedIcon}
      </MUIIconButton>
    </Tooltip>
  );
};

export default IconButton;
