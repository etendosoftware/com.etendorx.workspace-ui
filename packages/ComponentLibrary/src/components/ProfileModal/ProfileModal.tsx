'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, Menu, useTheme } from '@mui/material';
import CheckCircle from '../../assets/icons/check-circle.svg';
import UserProfile from './UserProfile';
import ToggleSection from './ToggleButton';
import SelectorList from './ToggleSection';
import { ProfileModalProps } from './types';
import { MODAL_WIDTH, menuSyle, useStyle } from './styles';
import IconButton from '../IconButton';
import { Option } from '../Input/Select/types';
import { Language } from '../../locales/types';

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
  currentRole,
  currentWarehouse,
  roles,
  changeProfile,
  onSetDefaultConfiguration,
  logger,
  translations,
  onSignOff,
  language,
  languages,
  languagesFlags,
  onLanguageChange,
}) => {
  const [currentSection, setCurrentSection] = useState<string>('profile');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRole, setSelectedRole] = useState<Option | null>(() => {
    if (currentRole) {
      return { title: currentRole.name, value: currentRole.id, id: currentRole.id };
    } else {
      return null;
    }
  });
  const [selectedWarehouse, setSelectedWarehouse] = useState<Option | null>(() => {
    if (currentWarehouse) {
      return { title: currentWarehouse.name, value: currentWarehouse.id, id: currentWarehouse.id };
    } else {
      return null;
    }
  });
  const [selectedLanguage, setSelectedLanguage] = useState<Option | null>(() => {
    const currentLang = languages.find(lang => lang.language === language);
    return currentLang
      ? {
          title: currentLang.name,
          value: currentLang.language,
          id: currentLang.id,
        }
      : null;
  });
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const theme = useTheme();
  const { styles, sx } = useStyle();

  useEffect(() => {
    if (currentRole) {
      setSelectedRole({ title: currentRole.name, value: currentRole.id, id: currentRole.id });
    }

    if (currentWarehouse) {
      setSelectedWarehouse({
        title: currentWarehouse.name,
        value: currentWarehouse.id,
        id: currentWarehouse.id,
      });
    }
  }, [currentRole, currentWarehouse]);

  useEffect(() => {
    if (language) {
      console.debug({ languages, language });
      const currentLang = languages.find(lang => lang.language === language);
      if (currentLang) {
        setSelectedLanguage({
          title: currentLang.name,
          value: currentLang.language,
          id: currentLang.id,
        });
      }
    }
  }, [language, languages]);

  const handleRoleChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedRole(value);
    setSelectedWarehouse(null);
  }, []);

  const handleWarehouseChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedWarehouse(value);
    if (value) {
      localStorage.setItem('currentWarehouse', JSON.stringify(value));
    }
  }, []);

  const handleSaveAsDefaultChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSaveAsDefault(event.target.checked);
  }, []);

  const handleToggle = useCallback((section: string) => {
    setCurrentSection(section);
  }, []);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (currentSection === 'profile') {
      try {
        const params: { role?: string; warehouse?: string } = {};

        if (selectedRole && selectedRole.value !== currentRole?.id) {
          params.role = selectedRole.value;
        }

        if (selectedWarehouse && selectedWarehouse.value !== currentWarehouse?.id) {
          params.warehouse = selectedWarehouse.value;

          const newWarehouse = {
            id: selectedWarehouse.id,
            title: selectedWarehouse.title,
            value: selectedWarehouse.value,
          };
          setSelectedWarehouse(newWarehouse);
          localStorage.setItem('currentWarehouse', JSON.stringify(newWarehouse)); // Guardar en localStorage
        }

        if (Object.keys(params).length > 0) {
          await changeProfile(params);
        }

        if (selectedLanguage && selectedLanguage.value !== language) {
          onLanguageChange(selectedLanguage.value as Language);
        }

        if (saveAsDefault) {
          await onSetDefaultConfiguration({
            defaultRole: selectedRole?.value,
            defaultWarehouse: selectedWarehouse?.value,
            language: selectedLanguage?.id,
            client: 'System',
          });
        }

        handleClose();
      } catch (error) {
        logger.error('Error changing role, warehouse, or saving default configuration:', error);
      }
    }
  }, [
    currentSection,
    selectedRole,
    currentRole?.id,
    selectedWarehouse,
    currentWarehouse?.id,
    selectedLanguage,
    language,
    saveAsDefault,
    handleClose,
    changeProfile,
    onLanguageChange,
    onSetDefaultConfiguration,
    logger,
  ]);

  const isSaveDisabled = useMemo(() => {
    if (!selectedRole) {
      return true;
    }

    const roleChanged = selectedRole && selectedRole?.value !== currentRole?.id;
    const warehouseChanged = selectedWarehouse && selectedWarehouse?.value !== currentWarehouse?.id;
    const languageChanged = selectedLanguage && selectedLanguage?.value !== language;

    const somethingChanged = roleChanged || warehouseChanged || languageChanged || saveAsDefault;

    return !somethingChanged;
  }, [
    currentRole?.id,
    currentWarehouse?.id,
    language,
    saveAsDefault,
    selectedLanguage,
    selectedRole,
    selectedWarehouse,
  ]);

  const handleLanguageChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    if (value) {
      setSelectedLanguage(value);
    }
  }, []);

  return (
    <>
      <IconButton tooltip={tooltipButtonProfile} onClick={handleClick}>
        {icon}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          '& .MuiPaper-root': {
            width: MODAL_WIDTH,
            ...styles.paperStyleMenu,
          },
        }}
        MenuListProps={{ sx: menuSyle }}>
        <UserProfile
          photoUrl={userPhotoUrl}
          name={userName}
          email={userEmail}
          sectionTooltip={sectionTooltip}
          onSignOff={onSignOff}
        />
        <div style={styles.toggleSectionStyles}>
          <ToggleSection sections={sections} currentSection={currentSection} onToggle={handleToggle} />
        </div>
        <SelectorList
          section={currentSection}
          passwordLabel={passwordLabel}
          newPasswordLabel={newPasswordLabel}
          confirmPasswordLabel={confirmPasswordLabel}
          onRoleChange={handleRoleChange}
          onWarehouseChange={handleWarehouseChange}
          onLanguageChange={handleLanguageChange}
          roles={roles}
          selectedRole={selectedRole}
          selectedWarehouse={selectedWarehouse}
          languages={languages}
          selectedLanguage={selectedLanguage}
          saveAsDefault={saveAsDefault}
          onSaveAsDefaultChange={handleSaveAsDefaultChange}
          translations={translations}
          languagesFlags={languagesFlags}
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
