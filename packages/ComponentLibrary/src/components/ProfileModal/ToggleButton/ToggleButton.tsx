import React from 'react';
import { Button } from '@mui/material';
import { ToggleButtonProps } from './ToggleButton.types';
import { buttonStyles } from './ToggleButton.styles';
import { theme } from '../../../theme';

const ToggleButton: React.FC<ToggleButtonProps> = ({
  isSelected,
  onClick,
  icon,
  children,
}) => {
  return (
    <Button
      style={{
        ...buttonStyles,
        backgroundColor: isSelected ? theme.palette.baselineColor.neutral[0] : '',
      }}
      onClick={onClick}
      startIcon={isSelected ? icon : null}>
      {children}
    </Button>
  );
};

export default ToggleButton;
