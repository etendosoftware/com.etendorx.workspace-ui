/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import { useLanguage } from "@/contexts/language";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@mui/material";
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
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import { useWindowStore } from "@/stores/windowStore";
import { toast } from "sonner";

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
  currentClient,
  roles,
  changeProfile,
  onSetDefaultConfiguration,
  onPasswordChange,
  logger,
  translations,
  language,
  languages,
  onLanguageChange,
  saveAsDefault,
  onSaveAsDefaultChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { styles } = useStyle();
  const [currentSection, setCurrentSection] = useState<string>("profile");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { language: initialLanguage, getFlag } = useLanguage();
  const [languagesFlags, setLanguageFlags] = useState(getFlag(initialLanguage));
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const cleanWindowState = useWindowStore((s) => s.cleanState);

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

  // Track whether the user explicitly picked an org/warehouse. On a role switch we auto-fill
  // these for display only; we must NOT send them, so the backend computes the role's real
  // defaults (matching Classic UI) instead of us forcing organizations[0]/warehouses[0].
  const [orgManuallySelected, setOrgManuallySelected] = useState(false);
  const [warehouseManuallySelected, setWarehouseManuallySelected] = useState(false);

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

  const handleRoleChange = useCallback(
    (_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
      setSelectedRole(value);
      // Switching role means "let the backend decide org/warehouse" until the user picks one.
      setOrgManuallySelected(false);
      setWarehouseManuallySelected(false);

      if (value) {
        const selectedRoleData = roles.find((role) => role.id === value.value);
        const defaultOrganization = selectedRoleData?.organizations?.[0];
        const defaultWarehouse = defaultOrganization?.warehouses?.[0];
        if (defaultOrganization) {
          setSelectedOrg({
            title: defaultOrganization.name,
            value: defaultOrganization.id,
            id: defaultOrganization.id,
          });
        } else {
          setSelectedOrg(DefaultOrg);
        }
        if (defaultWarehouse) {
          setSelectedWarehouse({
            title: defaultWarehouse.name,
            value: defaultWarehouse.id,
            id: defaultWarehouse.id,
          });
        } else {
          setSelectedWarehouse(null);
        }
      } else {
        setSelectedOrg(DefaultOrg);
        setSelectedWarehouse(null);
      }
    },
    [roles]
  );

  const handleOrgChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedOrg(value ?? DefaultOrg);
    setOrgManuallySelected(true);
    // Changing org clears the warehouse; let the backend default it unless the user picks one.
    setSelectedWarehouse(null);
    setWarehouseManuallySelected(false);
  }, []);

  const handleWarehouseChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedWarehouse(value);
    setWarehouseManuallySelected(true);
    if (value) {
      localStorage.setItem("currentWarehouse", JSON.stringify(value));
    }
  }, []);

  const handleToggle = useCallback(
    (section: string) => {
      if (currentSection === "password" && section !== "password") {
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        setPasswordError("");
      }
      setCurrentSection(section);
    },
    [currentSection]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!anchorEl) {
        setAnchorEl(event.currentTarget);
      } else {
        setAnchorEl(null);
      }
    },
    [anchorEl]
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setCurrentSection("profile");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setPasswordError("");
  }, []);

  const getProfileUpdates = useCallback(() => {
    const params: { role?: string; organization?: string; warehouse?: string } = {};

    if (selectedRole && selectedRole.value !== currentRole?.id) {
      params.role = selectedRole.value;
    }

    if (orgManuallySelected && selectedOrg && selectedOrg.value !== currentOrganization?.id) {
      params.organization = selectedOrg.value;
    }

    if (warehouseManuallySelected && selectedWarehouse && selectedWarehouse.value !== currentWarehouse?.id) {
      params.warehouse = selectedWarehouse.value;

      const newWarehouse = {
        id: selectedWarehouse.id,
        title: selectedWarehouse.title,
        value: selectedWarehouse.value,
      };
      setSelectedWarehouse(newWarehouse);
      localStorage.setItem("currentWarehouse", JSON.stringify(newWarehouse));
    }

    return params;
  }, [
    selectedRole,
    currentRole,
    selectedOrg,
    currentOrganization,
    selectedWarehouse,
    currentWarehouse,
    orgManuallySelected,
    warehouseManuallySelected,
  ]);

  const saveConfigurationDefaults = useCallback(
    async (languageChanged: boolean) => {
      const getClientId = () => {
        let clientId = "0";

        // If staying on the same role, use the current role's client ID (most reliable)
        if (selectedRole?.value === currentRole?.id) {
          clientId = currentRole?.client || currentClient?.id || "0";
        } else {
          const role = roles.find((r) => r.id === selectedRole?.value);
          clientId = role?.client || currentClient?.id || "0";
        }

        if (clientId === "System") {
          return "0";
        }
        return clientId;
      };

      const clientId = getClientId();

      if (saveAsDefault) {
        await onSetDefaultConfiguration({
          defaultRole: selectedRole?.value,
          defaultWarehouse: selectedWarehouse?.value,
          organization: selectedOrg?.value,
          language: selectedLanguage?.id,
          client: clientId,
        });
      } else if (languageChanged) {
        // If language changed but saveAsDefault is false, we still want to persist the language choice
        // so the backend serves the correct localized content on next load.
        // We use the current values for others to avoid changing them if they weren't meant to be defaults.
        await onSetDefaultConfiguration({
          defaultRole: currentRole?.id,
          defaultWarehouse: currentWarehouse?.id,
          organization: currentOrganization?.id,
          language: selectedLanguage?.id,
          client: currentClient?.id && currentClient.id !== "System" ? currentClient.id : "0",
        });
      }
    },
    [
      saveAsDefault,
      onSetDefaultConfiguration,
      selectedRole,
      selectedWarehouse,
      selectedOrg,
      selectedLanguage,
      currentRole,
      currentWarehouse,
      currentOrganization,
      currentClient,
      roles,
    ]
  );

  const handleSave = useCallback(async () => {
    if (currentSection === "password") {
      setPasswordError("");
      if (!currentPwd || !newPwd || !confirmPwd) {
        setPasswordError(t("navigation.profile.passwordRequired"));
        return;
      }
      if (newPwd !== confirmPwd) {
        setPasswordError(t("navigation.profile.passwordMismatch"));
        return;
      }
      try {
        await onPasswordChange({ currentPwd, newPwd, confirmPwd });
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        handleClose();
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        const messageKey: Record<string, string> = {
          UINAVBA_CurrentPwdIncorrect: t("navigation.profile.errorCurrentPwdIncorrect"),
          CPDifferentPassword: t("navigation.profile.errorDifferentPassword"),
          UINAVBA_IncorrectPwd: t("navigation.profile.errorIncorrectPwd"),
          UINAVBA_UnequalPwd: t("navigation.profile.errorUnequalPwd"),
          CPPasswordNotStrongEnough: t("navigation.profile.errorNotStrongEnough"),
        };
        setPasswordError(messageKey[code] ?? t("navigation.profile.errorGeneric"));
      }
      return;
    }

    try {
      const params = getProfileUpdates();

      if (Object.keys(params).length > 0) {
        await changeProfile(params);
      }

      const languageChanged = selectedLanguage && selectedLanguage.value !== language;

      await saveConfigurationDefaults(!!languageChanged);

      cleanWindowState();
      handleClose();

      if (languageChanged) {
        // Force a hard reload to ensure all metadata and cached resources are refreshed with the new language
        onLanguageChange(selectedLanguage?.value as Language);
        window.location.reload();
      }
    } catch (error) {
      logger.warn("Error changing role, warehouse, or saving default configuration:", error);
      // Surface the failure instead of silently swallowing it: the backend save can fail
      // (e.g. it returns an unparseable/empty response) and the modal must not appear dead.
      toast.error(t("navigation.profile.configSaveError"));
    }
  }, [
    currentSection,
    currentPwd,
    newPwd,
    confirmPwd,
    onPasswordChange,
    t,
    handleClose,
    getProfileUpdates,
    changeProfile,
    selectedLanguage,
    language,
    saveConfigurationDefaults,
    cleanWindowState,
    onLanguageChange,
    logger,
  ]);

  const isSaveDisabled = useMemo(() => {
    if (currentSection === "password") {
      return !currentPwd || !newPwd || !confirmPwd;
    }

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
    currentSection,
    currentPwd,
    newPwd,
    confirmPwd,
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
      <IconButton onClick={handleClick} className="w-10 h-10" data-testid="IconButton__75987a">
        {icon}
      </IconButton>
      <Menu anchorEl={anchorEl} onClose={handleClose} className="w-[20.75rem]" data-testid="Menu__75987a">
        <UserProfile photoUrl={userPhotoUrl} name={userName} email={userEmail} data-testid="UserProfile__75987a" />
        <div style={styles.toggleSectionStyles}>
          <ToggleSection
            sections={sections}
            currentSection={currentSection}
            onToggle={handleToggle}
            data-testid="ToggleSection__75987a"
          />
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
          currentPwd={currentPwd}
          newPwd={newPwd}
          confirmPwd={confirmPwd}
          onCurrentPwdChange={setCurrentPwd}
          onNewPwdChange={setNewPwd}
          onConfirmPwdChange={setConfirmPwd}
          passwordError={passwordError}
          data-testid="SelectorList__75987a"
        />
        <div style={styles.buttonContainerStyles}>
          <Button className="flex-[1_0_0]" variant="outlined" onClick={handleClose} data-testid="Button__75987a">
            {t("common.cancel")}
          </Button>
          <Button
            className="flex-[1_0_0]"
            variant="filled"
            startIcon={<CheckCircle fill={theme.palette.baselineColor.neutral[0]} data-testid="CheckCircle__75987a" />}
            onClick={handleSave}
            disabled={isSaveDisabled}
            data-testid="Button__75987a">
            {t("common.save")}
          </Button>
        </div>
      </Menu>
    </div>
  );
};

export default ProfileModal;
