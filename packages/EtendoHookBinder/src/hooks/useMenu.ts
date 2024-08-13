import { useEffect, useState } from 'react';
import { Metadata } from '../api/metadata';
import { Menu } from '../api/types';

const applyIcons = (items: Menu[]) => {
  return items.map(menu => {
    return {
      ...menu,
      icon: '⊡',
    };
  });
};

export const useMenu = () => {
  const [menu, setMenu] = useState<Menu[]>(Metadata.getCachedMenu());

  useEffect(() => {
    const initialize = async () => {
      const _menu = applyIcons(await Metadata.getMenu());
      setMenu(_menu);
    };

    initialize();
  }, []);

  return menu;
};
