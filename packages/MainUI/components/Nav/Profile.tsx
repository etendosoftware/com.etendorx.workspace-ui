import { useContext, useState, useCallback, useMemo } from 'react';
import { UserContext } from '../../contexts/user';
import { logger } from '../../utils/logger';
import { ProfileWrapperProps } from './types';
import ProfileModal from '@workspaceui/componentlibrary/src/components/ProfileModal/ProfileModal';
import { useLanguage } from '../../hooks/useLanguage';
import { DefaultConfiguration, Language } from '../../contexts/types';

const ProfileWrapper = (props: ProfileWrapperProps) => {
  const {
    setDefaultConfiguration,
    currentRole,
    profile,
    currentWarehouse,
    changeProfile,
    roles,
    token,
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

  const handleLanguageChange = useCallback(
    (l: Language) => {
      setLanguage(l);
    },
    [setLanguage],
  );

  const languagesWithFlags = useMemo(() => {
    return languages.map(lang => ({
      ...lang,
      flagEmoji: getFlag(lang.language as Language),
      displayName: `${getFlag(lang.language as Language)} ${lang.name}`,
    }));
  }, [languages, getFlag]);

  const flagString = getFlag(language);

  const handleSetDefaultConfiguration = useCallback(
    (config: DefaultConfiguration) => {
      if (!token) throw new Error('No token available');
      return setDefaultConfiguration(token, config);
    },
    [setDefaultConfiguration, token],
  );

  if (!currentRole || !currentWarehouse) {
    return null;
  }

  return (
    <ProfileModal
      {...props}
      currentRole={currentRole}
      currentWarehouse={currentWarehouse}
      roles={roles}
      saveAsDefault={saveAsDefault}
      onLanguageChange={handleLanguageChange}
      language={language}
      languagesFlags={flagString}
      onSaveAsDefaultChange={handleSaveAsDefaultChange}
      changeProfile={changeProfile}
      onSetDefaultConfiguration={handleSetDefaultConfiguration}
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
