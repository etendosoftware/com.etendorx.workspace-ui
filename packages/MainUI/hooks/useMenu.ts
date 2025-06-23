import { useEffect, useState, useCallback, useRef } from "react";
import { useLoading } from "../contexts/loading";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { CurrentRole, Menu } from "@workspaceui/api-client/src/api/types";

export const useMenu = (token: string | null, currentRole?: CurrentRole, language?: string | null) => {
  const [menu, setMenu] = useState<Menu[]>(Metadata.getCachedMenu());
  const { showLoading, hideLoading } = useLoading();
  const isFetchingRef = useRef(false);

  const fetchMenu = useCallback(
    async (forceRefresh = false) => {
      isFetchingRef.current = true;

      showLoading();

      try {
        const newMenu = await Metadata.getMenu(forceRefresh);
        setMenu(newMenu);
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        isFetchingRef.current = false;
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  useEffect(() => {
    if (
      token &&
      currentRole &&
      !isFetchingRef.current 
    ) {
      fetchMenu(true);
    }
  }, [token, currentRole, fetchMenu, language]);

  return menu;
};
