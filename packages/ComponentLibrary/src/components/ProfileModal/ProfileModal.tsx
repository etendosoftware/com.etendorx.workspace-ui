import React, { useState } from 'react';
import Modal from '../Modal';
import UserProfile from './UserProfile';
import ToggleSection from './ToggleSection/ToggleSection';
import SelectorList from './SelectorList/SelectorListMock';
import {
  buttonContainerStyles,
  buttonStyles,
  saveButtonStyles,
} from './ProfileModal.styles';
import { Button } from '@mui/material';
import { toggleSectionStyles } from './ToggleSection/ToggleSection.styles';

import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockIcon from '@mui/icons-material/Lock';
import { Section } from './ToggleSection/ToggleSection.types';

const sections: Section[] = [
  { id: 'profile', label: 'Perfil', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Contraseña', icon: <LockIcon /> },
];

const ProfileModal: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<string>('profile');

  const handleToggle = (selectedSection: string) => {
    setCurrentSection(selectedSection);
  };

  return (
    <Modal width={332}>
      <UserProfile />
      <div style={toggleSectionStyles}>
        <ToggleSection
          sections={sections}
          currentSection={currentSection}
          onToggle={handleToggle}
        />
      </div>
      <SelectorList section={currentSection} />
      <div style={buttonContainerStyles}>
        <Button sx={buttonStyles} variant="contained" color="primary">
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<TaskAltIcon />}
          sx={saveButtonStyles}>
          Guardar
        </Button>
      </div>
    </Modal>
  );
};

export default ProfileModal;
