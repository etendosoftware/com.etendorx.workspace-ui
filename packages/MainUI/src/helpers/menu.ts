import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useEffect, useState } from 'react';

export const useMenu = () => {
  const [menu, setMenu] = useState(window.OB.Application.menu);

  useEffect(() => {
    const f = async () => {
      await Metadata.getSession();
      setMenu(window.OB.Application.menu);
    };

    f();
  }, []);

  return menu;
};
