import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import { useMenu } from '../hooks/useMenu';
import EtendoLogotype from '../assets/etendo-logotype.png';

export default function Sidebar() {
  const menu = useMenu();
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
