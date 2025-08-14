/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useEffect, useState, useCallback } from "react";
import { useLoading } from "../contexts/loading";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { CurrentRole, Menu } from "@workspaceui/api-client/src/api/types";

export const useMenu = (token: string | null, currentRole?: CurrentRole, language?: string | null) => {
  const [menu, setMenu] = useState<Menu[]>(Metadata.getCachedMenu());
  const { showLoading, hideLoading } = useLoading();

  const fetchMenu = useCallback(
    async (forceRefresh = false) => {
      showLoading();

      try {
        const newMenu = await Metadata.getMenu(forceRefresh);
        setMenu(newMenu);
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  useEffect(() => {
    if (token && currentRole) {
      fetchMenu(true);
    }
  }, [token, currentRole, fetchMenu, language]);

  return menu;
};
