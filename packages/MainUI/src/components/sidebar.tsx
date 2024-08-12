import { useNavigate } from 'react-router-dom';
import { useMenu } from '../helpers/menu';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import EtendoLogotype from '../assets/etendo-logotype.png';
import { Section } from '@workspaceui/componentlibrary/components/Drawer/types';
import { useCallback } from 'react';

export default function Sidebar() {
  const menu = useMenu();
  const navigate = useNavigate();

  const handleSectionClick = useCallback(
    (section: Section) => {
      navigate({ pathname: `/window/${section.id}` });
    },
    [navigate],
  );

  return (
    <Drawer
      headerImage={EtendoLogotype}
      headerTitle="Etendo"
      sectionGroups={menu}
      onClick={handleSectionClick}
    />
  );
}
