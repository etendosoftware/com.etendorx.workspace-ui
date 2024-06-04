import { Button } from '@mui/material';
import {
  toggleContainerStyles,
  toggleButtonStyles,
} from './ToggleSection.styles';
import { ToggleSectionsProps } from './ToggleSection.types';

const ToggleSections = <T extends string>({
  sections,
  currentSection,
  onToggle,
}: ToggleSectionsProps<T>) => {
  return (
    <div style={toggleContainerStyles}>
      {sections.map(section => (
        <Button
          key={section.id}
          style={{
            ...toggleButtonStyles,
            backgroundColor: currentSection === section.id ? '#fff' : '',
          }}
          onClick={() => onToggle(section.id)}
          startIcon={currentSection === section.id ? section.icon : null}>
          {section.label}
        </Button>
      ))}
    </div>
  );
};

export default ToggleSections;
