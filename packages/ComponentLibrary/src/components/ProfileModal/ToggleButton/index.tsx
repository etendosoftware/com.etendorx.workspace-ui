import React from 'react';
import { Button } from '@mui/material';
import { toggleContainerStyles, toggleButtonStyles } from './styles';
import { ToggleSectionsProps } from './types';
import { theme } from '../../../theme';

const ToggleSections: React.FC<ToggleSectionsProps> = ({
  sections,
  currentSection,
  onToggle,
}) => {
  return (
    <div style={toggleContainerStyles}>
      {sections.map(({ id, label, icon }) => {
        const isActive = currentSection === id;
        return (
          <Button
            key={id}
            style={{
              ...toggleButtonStyles,
              backgroundColor: isActive
                ? theme.palette.baselineColor.neutral[0]
                : '',
            }}
            onClick={() => onToggle(id)}
            startIcon={isActive ? icon : null}>
            {label}
          </Button>
        );
      })}
    </div>
  );
};

export default ToggleSections;
