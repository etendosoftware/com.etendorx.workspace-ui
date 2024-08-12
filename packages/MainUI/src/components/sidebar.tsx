import { useMenu } from '../helpers/menu';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import EtendoLogotype from '../assets/etendo-logotype.png';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const menu = useMenu();
  const navigate = useNavigate();

  return (
    <Drawer
      logo={EtendoLogotype}
      title="Etendo"
      items={menu}
    />
  );
}
