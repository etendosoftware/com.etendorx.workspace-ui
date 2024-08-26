import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import { useMenu } from '@workspaceui/etendohookbinder/src/hooks/useMenu';
import EtendoLogotype from '../assets/etendo-logotype.png';
import { useUserContext } from '../hooks/useUserContext';

export default function Sidebar() {
  const { token } = useUserContext()
  const menu = useMenu(token);
  const navigate = useNavigate();

  const handleClick = useCallback(
    (pathname: string) => navigate({ pathname }),
    [navigate],
  );

  return (
    <Drawer
      logo={EtendoLogotype}
      title="Etendo"
      items={menu}
      onClick={handleClick}
    />
  );
}
