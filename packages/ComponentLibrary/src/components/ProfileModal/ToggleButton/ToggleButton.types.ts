import React from 'react';

export interface ToggleButtonProps {
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactElement | null;
  children: React.ReactNode;
}