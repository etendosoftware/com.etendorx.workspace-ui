"use client";

import { useLanguage } from "@/contexts/language";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, useTheme } from "@mui/material";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import type { Language } from "@workspaceui/componentlibrary/src/locales/types";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import CheckCircle from "../../../ComponentLibrary/src/assets/icons/check-circle.svg";
import ToggleSection from "./ToggleButton";
import SelectorList from "./ToggleSection";
import UserProfile from "./UserProfile";
import { useStyle } from "./styles";
import type { ProfileModalProps } from "./types";

const DefaultOrg = { title: "*", value: "0", id: "0" };

const ProfileModal: React.FC<ProfileModalProps> = ({
  userPhotoUrl,
  userName,
  userEmail,
  icon,
  sections,
  currentRole,
  currentOrganization,
  currentWarehouse,
  roles,
  changeProfile,
  onSetDefaultConfiguration,
  logger,
  translations,
  onSignOff,
  language,
  languages,
  onLanguageChange,
  saveAsDefault,
  onSaveAsDefaultChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { styles, sx } = useStyle();
  const [currentSection, setCurrentSection] = useState<string>("profile");
  const { language: initialLanguage, getFlag } = useLanguage();
  const [languagesFlags, setLanguageFlags] = useState(getFlag(initialLanguage));
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const [selectedRole, setSelectedRole] = useState<Option | null>(() => {
    if (currentRole) {
      return { title: currentRole.name, value: currentRole.id, id: currentRole.id };
    }
    return null;
  });

  const selectedClient = useMemo(() => {
    const client = selectedRole && roles.find((r) => r.id === selectedRole.value)?.client;
    return client ? { title: client, value: client, id: client } : null;
  }, [selectedRole, roles]);

  const [selectedOrg, setSelectedOrg] = useState<Option>(() => {
    if (currentOrganization) {
      return { title: currentOrganization.name, value: currentOrganization.id, id: currentOrganization.id };
    }
    return DefaultOrg;
  });

  const [selectedWarehouse, setSelectedWarehouse] = useState<Option | null>(() => {
    if (currentWarehouse) {
      return { title: currentWarehouse.name, value: currentWarehouse.id, id: currentWarehouse.id };
    }
    return null;
  });

  const [selectedLanguage, setSelectedLanguage] = useState<Option | null>(() => {
    const currentLang = languages.find((lang) => lang.language === language);
    return currentLang
      ? {
          title: currentLang.name,
          value: currentLang.language,
          id: currentLang.id,
        }
      : null;
  });

  useEffect(() => {
    if (currentRole) {
      setSelectedRole({ title: currentRole.name, value: currentRole.id, id: currentRole.id });
    }

    if (currentOrganization) {
      setSelectedOrg({ title: currentOrganization.name, value: currentOrganization.id, id: currentOrganization.id });
    }

    if (currentWarehouse) {
      setSelectedWarehouse({
        title: currentWarehouse.name,
        value: currentWarehouse.id,
        id: currentWarehouse.id,
      });
    }
  }, [currentRole, currentOrganization, currentWarehouse]);

  useEffect(() => {
    if (language) {
      const currentLang = languages.find((lang) => lang.language === language);
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
    setSelectedOrg(DefaultOrg);
    setSelectedWarehouse(null);
  }, []);

  const handleOrgChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedOrg(value ?? DefaultOrg);
    setSelectedWarehouse(null);
  }, []);

  const handleWarehouseChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedWarehouse(value);
    if (value) {
      localStorage.setItem("currentWarehouse", JSON.stringify(value));
    }
  }, []);

  const handleToggle = useCallback((section: string) => {
    setCurrentSection(section);
  }, []);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!anchorEl) {
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
    }
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (currentSection === "profile") {
      try {
        const params: { role?: string; organization?: string; warehouse?: string } = {};

        if (selectedRole && selectedRole.value !== currentRole?.id) {
          params.role = selectedRole.value;
        }

        if (selectedOrg && selectedOrg.value !== currentOrganization?.id) {
          params.organization = selectedOrg.value;
        }

        if (selectedWarehouse && selectedWarehouse.value !== currentWarehouse?.id) {
          params.warehouse = selectedWarehouse.value;

          const newWarehouse = {
            id: selectedWarehouse.id,
            title: selectedWarehouse.title,
            value: selectedWarehouse.value,
          };
          setSelectedWarehouse(newWarehouse);
          localStorage.setItem("currentWarehouse", JSON.stringify(newWarehouse));
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
            organization: selectedOrg?.value,
            language: selectedLanguage?.id,
          });
        }
        handleClose();
      } catch (error) {
        logger.warn("Error changing role, warehouse, or saving default configuration:", error);
      }
    }
  }, [
    currentSection,
    selectedRole,
    currentRole?.id,
    selectedOrg,
    currentOrganization?.id,
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
    const orgChanged = selectedOrg && selectedOrg?.value !== currentOrganization?.id;
    const warehouseChanged = selectedWarehouse && selectedWarehouse?.value !== currentWarehouse?.id;
    const languageChanged = selectedLanguage && selectedLanguage?.value !== language;

    const somethingChanged = roleChanged || orgChanged || warehouseChanged || languageChanged || saveAsDefault;

    return !somethingChanged;
  }, [
    currentRole?.id,
    currentOrganization?.id,
    currentWarehouse?.id,
    language,
    saveAsDefault,
    selectedRole,
    selectedOrg,
    selectedWarehouse,
    selectedLanguage,
  ]);

  const handleLanguageChange = useCallback(
    (_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
      if (value) {
        setSelectedLanguage(value);
        setLanguageFlags(getFlag(value.value as Language));
      }
    },
    [getFlag]
  );

  return (
    <div>
      <IconButton onClick={handleClick} className="w-10 h-10">
        {icon}
      </IconButton>
      <Menu anchorEl={anchorEl} onClose={handleClose} className="w-88">
        <UserProfile photoUrl={userPhotoUrl} name={userName} email={userEmail} onSignOff={onSignOff} />
        <div style={styles.toggleSectionStyles}>
          <ToggleSection sections={sections} currentSection={currentSection} onToggle={handleToggle} />
        </div>
        <SelectorList
          section={currentSection}
          onRoleChange={handleRoleChange}
          onOrgChange={handleOrgChange}
          onWarehouseChange={handleWarehouseChange}
          onLanguageChange={handleLanguageChange}
          roles={roles}
          selectedRole={selectedRole}
          selectedClient={selectedClient}
          selectedOrg={selectedOrg}
          selectedWarehouse={selectedWarehouse}
          languages={languages}
          selectedLanguage={selectedLanguage}
          saveAsDefault={saveAsDefault}
          onSaveAsDefaultChange={onSaveAsDefaultChange}
          translations={translations}
          languagesFlags={languagesFlags}
        />
        <div style={styles.buttonContainerStyles}>
          <Button sx={sx.buttonStyles} onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            startIcon={<CheckCircle fill={theme.palette.baselineColor.neutral[0]} />}
            sx={sx.saveButtonStyles}
            onClick={handleSave}
            disabled={isSaveDisabled}>
            {t("common.save")}
          </Button>
        </div>
      </Menu>
    </div>
  );
};

export default ProfileModal;
