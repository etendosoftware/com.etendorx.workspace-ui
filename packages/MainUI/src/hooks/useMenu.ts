import { useEffect, useState } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import type { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { useUserContext } from './useUserContext';

export const useMenu = () => {
  const { token } = useUserContext();
  const [menu, setMenu] = useState<Menu[]>(Metadata.getCachedMenu());

  useEffect(() => {
    const initialize = async () => {
      if (token) {
        Metadata.authorize(token);
        setMenu(await Metadata.getMenu());
      }
    };

    initialize();
  }, [token]);

  return menu;
};
