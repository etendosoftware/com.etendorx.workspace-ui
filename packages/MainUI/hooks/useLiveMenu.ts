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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useEffect, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useUserStore } from "@/stores/userStore";
import { logger } from "@/utils/logger";

/**
 * Menu of the current role, for screens that do not own it (the sidebar does). It reuses the cached menu or the
 * request already in flight, so it adds no request of its own.
 *
 * @returns The menu, empty until it is known
 */
export function useLiveMenu(): Menu[] {
  const roleId = useUserStore((s) => s.currentRole?.id);
  const [menu, setMenu] = useState<Menu[]>(() => Metadata.getCachedMenu());

  useEffect(() => {
    if (!roleId) return;
    let active = true;
    Metadata.getMenu()
      .then((loaded) => {
        if (active) setMenu(loaded);
      })
      .catch((err) => logger.warn("[useLiveMenu] Menu not available:", err));
    return () => {
      active = false;
    };
  }, [roleId]);

  return menu;
}
