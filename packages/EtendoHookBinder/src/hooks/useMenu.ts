import { useEffect, useState, useCallback } from 'react';
import { Metadata } from '../api/metadata';
import { Menu, Role } from '../api/types';

export const useMenu = (token: string | null, currentRole?: Role) => {
  const [menu, setMenu] = useState<Menu[]>(Metadata.getCachedMenu());

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
  }, [token, currentRole, fetchMenu]);

  return menu;
};
