import { useEffect, useState, useContext } from 'react';
import { Metadata } from '../api/metadata';
import { Menu } from '../api/types';
import { UserContext } from '../../../MainUI/src/contexts/user';

export const useMenu = () => {
  const { token, currentRole } = useContext(UserContext);
  const [menu, setMenu] = useState<Menu[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      if (token) {
        try {
          const newMenu = await Metadata.getMenu();
          setMenu(newMenu);
        } catch (error) {
          console.error('Error fetching menu:', error);
        }
      }
    };

    fetchMenu();

    return () => {
      Metadata.clearMenuCache();
    };
  }, [token, currentRole]);

  return menu;
};
