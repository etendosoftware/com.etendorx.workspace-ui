import { useMenu } from '../helpers/menu';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import EtendoLogotype from '../assets/etendo-logotype.png';

export default function Sidebar() {
  const menu = useMenu();

  return (
    <Drawer
      headerImage={EtendoLogotype}
      headerTitle="Etendo"
      items={menu}
    />
  );
}
