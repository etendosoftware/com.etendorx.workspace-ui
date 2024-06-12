import React from 'react';
import { Button } from '@mui/material';
import { ToggleButtonProps } from './ToggleButton.types';
import { buttonStyles } from './ToggleButton.styles';

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
        backgroundColor: isSelected ? '#fff' : '',
      }}
      onClick={onClick}
      startIcon={isSelected ? icon : null}>
      {children}
    </Button>
  );
};

export default ToggleButton;
