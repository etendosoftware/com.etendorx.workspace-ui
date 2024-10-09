import { useEffect, useState, useContext, useCallback } from 'react';
import { Metadata } from '../api/metadata';
import { Menu } from '../api/types';
import { UserContext } from '../../../MainUI/src/contexts/user';

export const useMenu = () => {
  const { token, currentRole } = useContext(UserContext);
  const [menu, setMenu] = useState<Menu[]>([]);

  const fetchMenu = useCallback(
    async (forceRefresh: boolean = false) => {
      if (token && currentRole) {
        try {
          const newMenu = await Metadata.getMenu(forceRefresh);
          setMenu(newMenu);
        } catch (error) {
          console.error('Error fetching menu:', error);
        }
      }
    },
    [token, currentRole],
  );

  useEffect(() => {
    if (token && currentRole) {
      fetchMenu(true);
    }

    return () => {};
  }, [token, currentRole, fetchMenu]);

  return menu;
};
