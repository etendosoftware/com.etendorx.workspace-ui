import { JSX, useContext } from 'react';
import { Profile } from '@workspaceui/componentlibrary/src/components';
import { UserContext } from '../../contexts/user';
import { logger } from '../../utils/logger';
import { ProfileModalProps } from '@workspaceui/componentlibrary/src/components/ProfileModal/types';

const ProfileWrapper = (props: JSX.IntrinsicAttributes & ProfileModalProps) => {
  const { changeRole, changeWarehouse, setDefaultConfiguration, currentRole, currentWarehouse, roles, token } =
    useContext(UserContext);

  return (
    <Profile
      {...props}
      currentRole={currentRole}
      currentWarehouse={currentWarehouse}
      roles={roles}
      onChangeRole={changeRole}
      onChangeWarehouse={changeWarehouse}
      onSetDefaultConfiguration={config => {
        if (!token) throw new Error('No token available');
        return setDefaultConfiguration(token, config);
      }}
      logger={logger}
    />
  );
};

export default ProfileWrapper;
