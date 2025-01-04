import { useContext, useState, useCallback } from 'react';
import { UserContext } from '../../contexts/user';
import { logger } from '../../utils/logger';
import { ProfileWrapperProps } from './types';
import { Option } from '@workspaceui/componentlibrary/src/components/Input/Select/types';
import ProfileModal from '@workspaceui/componentlibrary/src/components/ProfileModal/ProfileModal';
import { useLanguage } from '../../hooks/useLanguage';

const ProfileWrapper = (props: ProfileWrapperProps) => {
  const { changeRole, changeWarehouse, setDefaultConfiguration, currentRole, currentWarehouse, roles, token } =
    useContext(UserContext);

  const [selectedRole, setSelectedRole] = useState<Option | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Option | null>(null);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const { language, setLanguage } = useLanguage();

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
      onLanguageChange={setLanguage}
      language={language}
      onSaveAsDefaultChange={handleSaveAsDefaultChange}
      onChangeRole={changeRole}
      onChangeWarehouse={changeWarehouse}
      onSetDefaultConfiguration={config => {
        if (!token) throw new Error('No token available');
        return setDefaultConfiguration(token, config);
      }}
      logger={logger}
      onSignOff={handleSignOff}
    />
  );
};

export default ProfileWrapper;
