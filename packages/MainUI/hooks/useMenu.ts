import { useEffect, useState, useCallback, useRef } from "react";
import { useLoading } from "../contexts/loading";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { CurrentRole, Menu } from "@workspaceui/api-client/src/api/types";

export const useMenu = (token: string | null, currentRole?: CurrentRole, language?: string | null) => {
  const [menu, setMenu] = useState<Menu[]>(Metadata.getCachedMenu());
  const { showLoading, hideLoading } = useLoading();
  const isFetchingRef = useRef(false);
  const prevRoleRef = useRef<CurrentRole | undefined>(undefined);
  const prevLanguageRef = useRef<string | null | undefined>(undefined);

  const fetchMenu = useCallback(
    async (forceRefresh = false) => {
      isFetchingRef.current = true;
      prevRoleRef.current = currentRole;
      prevLanguageRef.current = language;

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
    [currentRole, language, showLoading, hideLoading]
  );

  useEffect(() => {
    if (
      token &&
      currentRole &&
      !isFetchingRef.current &&
      (currentRole.id !== prevRoleRef.current?.id || language !== prevLanguageRef.current)
    ) {
      fetchMenu(true);
    }
  }, [token, currentRole, fetchMenu, language]);

  return menu;
};
