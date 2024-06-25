import React from 'react';
import { Button } from '@mui/material';
import {
  toggleContainerStyles,
  toggleButtonStyles,
} from './ToggleSection.styles';
import { ToggleSectionsProps } from './ToggleSection.types';
import { theme } from '../../../theme';

const ToggleSections: React.FC<ToggleSectionsProps> = ({
  sections,
  currentSection,
  onToggle,
}) => {
  return (
    <div style={toggleContainerStyles}>
      {sections.map(({ id, label, icon }) => (
        <Button
          key={id}
          style={{
            ...toggleButtonStyles,
            backgroundColor: currentSection === id ? theme.palette.baselineColor.neutral[0] : '',
          }}
          onClick={() => onToggle(id)}
          startIcon={icon}>
          {label}
        </Button>
      ))}
    </div>
  );
};

export default ToggleSections;
