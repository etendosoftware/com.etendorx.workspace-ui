import { useEffect, useState } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import type { Menu } from '@workspaceui/etendohookbinder/src/api/types';

export const useMenu = () => {
  const [menu, setMenu] = useState<Menu[]>(Metadata.getCachedMenu());

  useEffect(() => {
    const initialize = async () => {
      setMenu(await Metadata.getMenu());
    };

    initialize();
  }, []);

  return menu;
};
