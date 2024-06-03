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
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { toggleSectionStyles } from './ToggleSection/ToggleSection.styles';

const ProfileModal: React.FC = () => {
  const [section, setSection] = useState<'profile' | 'password'>('profile');

  const handleToggle = (selectedSection: 'profile' | 'password') => {
    setSection(selectedSection);
  };

  return (
    <Modal width={332}>
      <UserProfile />
      <div style={toggleSectionStyles}>
        <ToggleSection section={section} onToggle={handleToggle} />
      </div>
      <SelectorList section={section} />
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
