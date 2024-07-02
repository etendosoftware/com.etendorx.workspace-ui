import React, { useState } from 'react';
import Modal from '../Modal';
import UserProfile from './UserProfile';
import ToggleSection from './ToggleButton';
import SelectorList from './ToggleSection';
import {
  MODAL_WIDTH,
  buttonContainerStyles,
  buttonStyles,
  saveButtonStyles,
} from './ProfileModal.styles';
import { Button } from '@mui/material';
import { toggleSectionStyles } from './ToggleButton/styles';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockIcon from '@mui/icons-material/Lock';
import { Section } from './ToggleButton/types';
import { ProfileModalProps } from './UserProfile.types';

const sections: Section[] = [
  { id: 'profile', label: 'Perfil', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Contraseña', icon: <LockIcon /> },
];

const ProfileModal: React.FC<ProfileModalProps> = ({
  cancelButtonText,
  saveButtonText,
  passwordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
}) => {
  const [currentSection, setCurrentSection] = useState<string>('profile');

  const handleToggle = (selectedSection: string) => {
    setCurrentSection(selectedSection);
  };

  return (
    <Modal width={MODAL_WIDTH}>
      <UserProfile />
      <div style={toggleSectionStyles}>
        <ToggleSection
          sections={sections}
          currentSection={currentSection}
          onToggle={handleToggle}
        />
      </div>
      <SelectorList
        section={currentSection}
        passwordLabel={passwordLabel}
        newPasswordLabel={newPasswordLabel}
        confirmPasswordLabel={confirmPasswordLabel}
      />
      <div style={buttonContainerStyles}>
        <Button sx={buttonStyles} variant="contained" color="primary">
          {cancelButtonText}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<TaskAltIcon />}
          sx={saveButtonStyles}>
          {saveButtonText}
        </Button>
      </div>
    </Modal>
  );
};

export default ProfileModal;
