import { useContext, useState, useCallback, useMemo } from 'react';
import { UserContext } from '../../contexts/user';
import { logger } from '../../utils/logger';
import { ProfileWrapperProps } from './types';
import ProfileModal from '@workspaceui/componentlibrary/src/components/ProfileModal/ProfileModal';
import { Language } from '../../contexts/types';
import { useLanguage } from '@/contexts/language';

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
    return languages.map(lang => ({
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
    />
  );
};

export default ProfileWrapper;
