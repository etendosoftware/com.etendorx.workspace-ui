'use client';

import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { IconButton as MUIIconButton, Box, Typography, useTheme } from '@mui/material';
import { useStyle } from './styles';
import { IIconComponentProps } from './types';

const IconButtonCmp: React.FC<IIconComponentProps> = ({
  fill,
  hoverFill,
  width = 24,
  height = 24,
  tooltip,
  sx,
  children,
  disabled,
  isHovered = false,
  iconText,
  ...props
}) => {
  const { styles } = useStyle();
  const theme = useTheme();

  const defaultFill = theme.palette.baselineColor.neutral[80];
  const defaultHoverFill = theme.palette.baselineColor.neutral[0];

  const actualFill = fill ?? defaultFill;
  const actualHoverFill = hoverFill ?? defaultHoverFill;

  const [iconFill, setIconFill] = useState<string>(actualFill);

  useEffect(() => {
    setIconFill(isHovered && !disabled ? actualHoverFill : actualFill);
  }, [isHovered, actualHoverFill, actualFill, disabled]);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIconFill(actualHoverFill);
    }
  }, [disabled, actualHoverFill]);

  const handleMouseLeave = useCallback(() => {
    if (!disabled) {
      setIconFill(actualFill);
    }
  }, [disabled, actualFill]);

  const combinedStyles = useMemo(
    () => ({
      ...styles.defaultContainer,
      ...sx,
    }),
    [styles.defaultContainer, sx],
  );

  const clonedIcon = useMemo(
    () =>
      React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement, {
            style: {
              fill: disabled ? theme.palette.action.disabled : iconFill,
              width,
              height,
            },
          })
        : null,
    [children, disabled, height, iconFill, theme.palette.action.disabled, width],
  );

  return (
    <div title={tooltip}>
      <MUIIconButton
        sx={combinedStyles}
        {...props}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        <Box sx={styles.buttonContainer}>
          {clonedIcon}
          {iconText && <Typography sx={styles.iconText}>{iconText}</Typography>}
        </Box>
      </MUIIconButton>
    </div>
  );
};

const IconButton = memo(IconButtonCmp);
export { IconButton };
export default IconButton;
