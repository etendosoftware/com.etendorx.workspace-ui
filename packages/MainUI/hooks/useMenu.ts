import { useEffect, useState, useCallback } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { CurrentRole, Menu } from "@workspaceui/api-client/src/api/types";

export const useMenu = (token: string | null, currentRole?: CurrentRole, language?: string | null) => {
  const [menu, setMenu] = useState<Menu[]>(Metadata.getCachedMenu());

  const fetchMenu = useCallback(
    async (forceRefresh = false) => {
      if (token && currentRole) {
        try {
          const newMenu = await Metadata.getMenu(forceRefresh);
          setMenu(newMenu);
        } catch (error) {
          console.error("Error fetching menu:", error);
        }
      }
    },
    [token, currentRole]
  );

  useEffect(() => {
    if (token && currentRole) {
      fetchMenu(true);
    }
  }, [token, currentRole, fetchMenu, language]);

  return menu;
};
