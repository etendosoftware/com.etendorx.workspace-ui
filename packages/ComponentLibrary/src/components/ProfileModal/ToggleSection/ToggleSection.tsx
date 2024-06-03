import React from 'react';
import {
  toggleContainerStyles,
  toggleButtonStyles,
} from './ToggleSection.styles';
import { Button } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockIcon from '@mui/icons-material/Lock';

interface ToggleSectionsProps {
  section: 'profile' | 'password';
  onToggle: (section: 'profile' | 'password') => void;
}

const ToggleSections: React.FC<ToggleSectionsProps> = ({
  section,
  onToggle,
}) => {
  return (
    <div style={toggleContainerStyles}>
      <Button
        style={{
          ...toggleButtonStyles,
          backgroundColor: section === 'profile' ? '#fff' : '',
        }}
        onClick={() => onToggle('profile')}
        startIcon={section === 'profile' ? <PersonOutlineIcon /> : null}>
        Perfil
      </Button>
      <Button
        style={{
          ...toggleButtonStyles,
          backgroundColor: section === 'password' ? '#fff' : '',
        }}
        onClick={() => onToggle('password')}
        startIcon={section === 'password' ? <LockIcon /> : null}>
        Contraseña
      </Button>
    </div>
  );
};

export default ToggleSections;
