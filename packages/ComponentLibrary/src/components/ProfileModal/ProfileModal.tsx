import React, { useState } from 'react';
import { Button, Menu } from '@mui/material';
import CheckCircle from '../../assets/icons/check-circle.svg';
import UserProfile from './UserProfile';
import ToggleSection from './ToggleButton';
import SelectorList from './ToggleSection';
import { ProfileModalProps } from './UserProfile.types';
import { MODAL_WIDTH, menuSyle, styles, sx } from './ProfileModal.styles';
import { toggleSectionStyles } from './ToggleButton/styles';
import IconButton from '../IconButton';
import { theme } from '../../theme';

const ProfileModal: React.FC<ProfileModalProps> = ({
  cancelButtonText,
  saveButtonText,
  tooltipButtonProfile,
  passwordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
  userPhotoUrl,
  userName,
  userEmail,
  sestionTooltip,
  icon,
  sections,
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
      <IconButton tooltip={tooltipButtonProfile} onClick={handleClick}>
        {icon}
      </IconButton>
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
        <UserProfile
          photoUrl={userPhotoUrl}
          name={userName}
          email={userEmail}
          sestionTooltip={sestionTooltip}
        />
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
          <Button sx={sx.buttonStyles}>{cancelButtonText}</Button>
          <Button
            startIcon={
              <CheckCircle fill={theme.palette.baselineColor.neutral[0]} />
            }
            sx={sx.saveButtonStyles}>
            {saveButtonText}
          </Button>
        </div>
      </Menu>
    </>
  );
};

export default ProfileModal;
