import React, { useState } from 'react';
import { Button, IconButton, Tooltip, Menu } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockIcon from '@mui/icons-material/Lock';
import { Person } from '@mui/icons-material';
import UserProfile from './UserProfile';
import ToggleSection from './ToggleButton';
import SelectorList from './ToggleSection';
import { ProfileModalProps } from './UserProfile.types';
import { MODAL_WIDTH, menuSyle, styles } from './ProfileModal.styles';
import { Section } from './ToggleButton/types';
import { sx } from '../Waterfall/WaterfallModal.styles';
import { toggleSectionStyles } from './ToggleButton/styles';

const sections: Section[] = [
  { id: 'profile', label: 'Perfil', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Contraseña', icon: <LockIcon /> },
];

const ProfileModal: React.FC<ProfileModalProps> = ({
  cancelButtonText,
  saveButtonText,
  tooltipButtonProfile,
  passwordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
}) => {
  const [currentSection, setCurrentSection] = useState<string>('profile');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleToggle = (selectedSection: string) => {
    setCurrentSection(selectedSection);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title={tooltipButtonProfile} arrow>
        <IconButton
          onClick={handleClick}
          style={styles.iconButtonStyles}
          sx={sx.hoverStyles}>
          <Person sx={sx.iconStyles} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: MODAL_WIDTH,
              ...styles.paperStyleMenu,
            },
          },
        }}
        MenuListProps={{ sx: menuSyle }}>
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
        <div style={styles.buttonContainerStyles}>
          <Button sx={styles.buttonStyles} variant="contained" color="primary">
            {cancelButtonText}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<TaskAltIcon />}
            sx={styles.saveButtonStyles}>
            {saveButtonText}
          </Button>
        </div>
      </Menu>
    </>
  );
};

export default ProfileModal;
