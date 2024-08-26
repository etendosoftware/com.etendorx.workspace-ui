import React, { useState, useCallback, useEffect } from 'react';
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
  disabled,
  isHovered = false,
  ...props
}) => {
  const [iconFill, setIconFill] = useState<string>(fill);

  useEffect(() => {
    setIconFill(isHovered ? hoverFill : fill);
  }, [isHovered, hoverFill, fill]);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIconFill(hoverFill);
    }
  }, [disabled, hoverFill]);

  const handleMouseLeave = useCallback(() => {
    if (!disabled) {
      setIconFill(fill);
    }
  }, [disabled, fill]);

  const combinedStyles = {
    ...defaultStyles,
    ...sx,
  };

  const clonedIcon = React.cloneElement(children as React.ReactElement, {
    style: {
      fill: disabled ? theme.palette.action.disabled : iconFill,
      width,
      height,
    },
  });

  const button = (
    <MUIIconButton
      sx={combinedStyles}
      {...props}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {clonedIcon}
    </MUIIconButton>
  );

  if (disabled) {
    return (
      <Tooltip title={tooltip} arrow>
        <span>{button}</span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltip} arrow>
      {button}
    </Tooltip>
  );
};

export default IconButton;
