import { useMenu } from '../helpers/menu';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import EtendoLogotype from '../assets/etendo-logotype.png';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

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
