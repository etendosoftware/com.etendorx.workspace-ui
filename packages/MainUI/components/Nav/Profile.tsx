import { useContext, useState, useCallback, useMemo } from 'react';
import { UserContext } from '../../contexts/user';
import { logger } from '../../utils/logger';
import { ProfileWrapperProps } from './types';
import { Option } from '@workspaceui/componentlibrary/src/components/Input/Select/types';
import ProfileModal from '@workspaceui/componentlibrary/src/components/ProfileModal/ProfileModal';
import { useLanguage } from '../../hooks/useLanguage';
import { Language } from '../../contexts/types';

const ProfileWrapper = (props: ProfileWrapperProps) => {
  const {
    changeRole,
    changeWarehouse,
    setDefaultConfiguration,
    currentRole,
    profile,
    currentWarehouse,
    roles,
    token,
    languages,
  } = useContext(UserContext);

  const [selectedRole, setSelectedRole] = useState<Option | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Option | null>(null);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const { language, setLanguage, getFlag } = useLanguage();

  const { clearUserData } = useContext(UserContext);

  const handleSignOff = useCallback(() => {
    clearUserData();
  }, [clearUserData]);

  const handleRoleChange = useCallback((event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedRole(value);
    setSelectedWarehouse(null);
  }, []);

  const handleWarehouseChange = useCallback((event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedWarehouse(value);
  }, []);

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

  return (
    <ProfileModal
      {...props}
      currentRole={currentRole}
      currentWarehouse={currentWarehouse}
      roles={roles}
      selectedRole={selectedRole}
      selectedWarehouse={selectedWarehouse}
      saveAsDefault={saveAsDefault}
      onRoleChange={handleRoleChange}
      onWarehouseChange={handleWarehouseChange}
      onLanguageChange={handleLanguageChange}
      language={language}
      languagesFlags={flagString}
      onSaveAsDefaultChange={handleSaveAsDefaultChange}
      onChangeRole={changeRole}
      onChangeWarehouse={changeWarehouse}
      onSetDefaultConfiguration={config => {
        if (!token) throw new Error('No token available');
        return setDefaultConfiguration(token, config);
      }}
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
