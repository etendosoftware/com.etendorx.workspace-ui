import React, { useState, useContext, useCallback, useEffect } from 'react';
import { Button, Menu } from '@mui/material';
import CheckCircle from '../../assets/icons/check-circle.svg';
import UserProfile from './UserProfile';
import ToggleSection from './ToggleButton';
import SelectorList from './ToggleSection';
import { ProfileModalProps } from './types';
import { MODAL_WIDTH, menuSyle, styles, sx } from './styles';
import { toggleSectionStyles } from './ToggleButton/styles';
import IconButton from '../IconButton';
import { theme } from '../../theme';
import { UserContext } from '../../../../MainUI/src/contexts/user';
import { Option } from '../Input/Select/types';
import { useNavigate } from 'react-router-dom';
import { logger } from '../../../../MainUI/src/utils/logger';

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
  sectionTooltip,
  icon,
  sections,
}) => {
  const [currentSection, setCurrentSection] = useState<string>('profile');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRole, setSelectedRole] = useState<Option | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Option | null>(null);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const navigate = useNavigate();
  const { changeRole, changeWarehouse, currentRole, currentWarehouse, roles, setDefaultConfiguration, token } =
    useContext(UserContext);

  useEffect(() => {
    if (currentRole) {
      setSelectedRole({ title: currentRole.name, value: currentRole.id, id: currentRole.id });
    }
  }, [currentRole]);

  useEffect(() => {
    if (currentWarehouse) {
      setSelectedWarehouse({ title: currentWarehouse.name, value: currentWarehouse.id, id: currentWarehouse.id });
    }
  }, [currentWarehouse]);

  const handleRoleChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedRole(value);
    setSelectedWarehouse(null);
  }, []);

  const handleWarehouseChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedWarehouse(value);
  }, []);

  const handleSaveAsDefaultChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSaveAsDefault(event.target.checked);
  }, []);

  const handleSave = useCallback(async () => {
    if (currentSection === 'profile') {
      try {
        if (selectedRole && selectedRole.value !== currentRole?.id) {
          await changeRole(selectedRole.value);
        }
        if (selectedWarehouse && selectedWarehouse.value !== currentWarehouse?.id) {
          await changeWarehouse(selectedWarehouse.value);
        }
        if (saveAsDefault && token) {
          await setDefaultConfiguration(token, {
            defaultRole: selectedRole?.value,
            defaultWarehouse: selectedWarehouse?.value,
            organization: currentRole?.orgList[0]?.id,
            language: '192',
            client: 'System',
          });
        }
        handleClose();
        navigate('/');
      } catch (error) {
        logger.error('Error changing role, warehouse, or saving default configuration:', error);
      }
    }
  }, [
    changeRole,
    changeWarehouse,
    currentRole?.id,
    currentRole?.orgList,
    currentSection,
    currentWarehouse?.id,
    navigate,
    saveAsDefault,
    selectedRole,
    selectedWarehouse,
    setDefaultConfiguration,
    token,
  ]);

  const handleToggle = (section: string) => {
    setCurrentSection(section);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isSaveDisabled =
    currentSection === 'profile' &&
    (!selectedRole || selectedRole.value === currentRole?.id) &&
    (!selectedWarehouse || selectedWarehouse.value === currentWarehouse?.id) &&
    !saveAsDefault;

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
        <UserProfile photoUrl={userPhotoUrl} name={userName} email={userEmail} sectionTooltip={sectionTooltip} />
        <div style={toggleSectionStyles}>
          <ToggleSection sections={sections} currentSection={currentSection} onToggle={handleToggle} />
        </div>
        <SelectorList
          section={currentSection}
          passwordLabel={passwordLabel}
          newPasswordLabel={newPasswordLabel}
          confirmPasswordLabel={confirmPasswordLabel}
          onRoleChange={handleRoleChange}
          onWarehouseChange={handleWarehouseChange}
          roles={roles}
          selectedRole={selectedRole}
          selectedWarehouse={selectedWarehouse}
          saveAsDefault={saveAsDefault}
          onSaveAsDefaultChange={handleSaveAsDefaultChange}
        />
        <div style={styles.buttonContainerStyles}>
          <Button sx={sx.buttonStyles} onClick={handleClose}>
            {cancelButtonText}
          </Button>
          <Button
            startIcon={<CheckCircle fill={theme.palette.baselineColor.neutral[0]} />}
            sx={sx.saveButtonStyles}
            onClick={handleSave}
            disabled={isSaveDisabled}>
            {saveButtonText}
          </Button>
        </div>
      </Menu>
    </>
  );
};

export default ProfileModal;
