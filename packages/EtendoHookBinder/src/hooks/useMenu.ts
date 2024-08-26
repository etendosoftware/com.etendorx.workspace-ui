import { useEffect, useState } from 'react';
import { Metadata } from '../api/metadata';
import type { Menu } from '../api/types';

export const useMenu = (token?: string | null) => {
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
