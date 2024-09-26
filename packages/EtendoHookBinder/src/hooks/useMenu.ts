import { useEffect, useState } from 'react';
import { Metadata } from '../api/metadata';
import { Menu } from '../api/types';

export const useMenu = (token?: string | null) => {
  const [menu, setMenu] = useState<Menu[]>(Metadata.getCachedMenu());

  useEffect(() => {
    const initialize = async () => {
      if (token) {
        setMenu(await Metadata.getMenu());
      }
    };

    initialize();
  }, [token]);

  return menu;
};
