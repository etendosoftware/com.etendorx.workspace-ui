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

import { useContext, useState, useCallback, useMemo } from "react";
import { UserContext } from "../../contexts/user";
import { logger } from "../../utils/logger";
import type { ProfileWrapperProps } from "./types";
import type { Language } from "../../contexts/types";
import { useLanguage } from "@/contexts/language";
import ProfileModal from "../ProfileModal/ProfileModal";

const ProfileWrapper = (props: ProfileWrapperProps) => {
  const {
    setDefaultConfiguration,
    currentRole,
    currentOrganization,
    profile,
    currentWarehouse,
    changeProfile,
    roles,
    languages,
  } = useContext(UserContext);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const { language, setLanguage, getFlag } = useLanguage();

  const { clearUserData } = useContext(UserContext);

  const handleSignOff = useCallback(() => {
    clearUserData();
  }, [clearUserData]);

  const handleSaveAsDefaultChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSaveAsDefault(event.target.checked);
  }, []);

  const languagesWithFlags = useMemo(() => {
    return languages.map((lang) => ({
      ...lang,
      flagEmoji: getFlag(lang.language as Language),
      displayName: `${getFlag(lang.language as Language)} ${lang.name}`,
    }));
  }, [languages, getFlag]);

  const flagString = getFlag(language);

  if (!currentRole) {
    return null;
  }

  return (
    <ProfileModal
      {...props}
      currentRole={currentRole}
      currentWarehouse={currentWarehouse}
      currentOrganization={currentOrganization}
      roles={roles}
      saveAsDefault={saveAsDefault}
      onLanguageChange={setLanguage}
      language={language}
      languagesFlags={flagString}
      onSaveAsDefaultChange={handleSaveAsDefaultChange}
      changeProfile={changeProfile}
      onSetDefaultConfiguration={setDefaultConfiguration}
      logger={logger}
      onSignOff={handleSignOff}
      languages={languagesWithFlags}
      userName={profile.name}
      userEmail={profile.email}
      userPhotoUrl={profile.image}
      data-testid="ProfileModal__ecafff"
    />
  );
};

export default ProfileWrapper;
