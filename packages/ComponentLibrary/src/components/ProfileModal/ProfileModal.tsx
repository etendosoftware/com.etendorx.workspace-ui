import React, { useState, useContext } from 'react';
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
import { UserContext } from '../../../../MainUI/src/contexts/user';

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
  const [selectedRole, setSelectedRole] = useState<string>('');
  const { changeRole, currentRole, roles } = useContext(UserContext);

  const handleRoleChange = (newRoleId: string) => {
    setSelectedRole(newRoleId);
  };

  const handleSave = async () => {
    if (selectedRole && selectedRole !== currentRole?.id) {
      try {
        await changeRole(selectedRole);
        handleClose();
      } catch (error) {
        console.error('Error changing role:', error);
      }
    }
  };

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
        <UserProfile photoUrl={userPhotoUrl} name={userName} email={userEmail} sestionTooltip={sestionTooltip} />
        <div style={toggleSectionStyles}>
          <ToggleSection sections={sections} currentSection={currentSection} onToggle={handleToggle} />
        </div>
        <SelectorList
          section={currentSection}
          passwordLabel={passwordLabel}
          newPasswordLabel={newPasswordLabel}
          confirmPasswordLabel={confirmPasswordLabel}
          onRoleChange={handleRoleChange}
          roles={roles}
          currentRole={currentRole}
        />
        <div style={styles.buttonContainerStyles}>
          <Button sx={sx.buttonStyles} onClick={handleClose}>
            {cancelButtonText}
          </Button>
          <Button
            startIcon={<CheckCircle fill={theme.palette.baselineColor.neutral[0]} />}
            sx={sx.saveButtonStyles}
            onClick={handleSave}>
            {saveButtonText}
          </Button>
        </div>
      </Menu>
    </>
  );
};

export default ProfileModal;
