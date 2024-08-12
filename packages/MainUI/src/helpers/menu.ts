import { Menu } from '@workspaceui/componentlibrary/src/components/Drawer/menu';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useEffect, useState } from 'react';

const applyIcons = (items: Menu[]) => {
  return items.map(menu => {
    return {
      ...menu,
      icon: '⊡',
    };
  });
};

export const useMenu = () => {
  const [menu, setMenu] = useState(applyIcons(window.OB.Application.menu));

  useEffect(() => {
    const f = async () => {
      await Metadata.getSession();
      setMenu(applyIcons(window.OB.Application.menu));
    };

    f();
  }, []);

  return menu;
};
