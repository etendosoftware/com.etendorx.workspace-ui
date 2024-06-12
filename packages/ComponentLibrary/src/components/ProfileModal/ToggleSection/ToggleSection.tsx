import React from 'react';
import { Button } from '@mui/material';
import {
  toggleContainerStyles,
  toggleButtonStyles,
} from './ToggleSection.styles';
import { ToggleSectionsProps } from './ToggleSection.types';

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
            backgroundColor: currentSection === id ? '#fff' : '',
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
