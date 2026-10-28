/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/userStore";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { buildEtendoClassicBookmarkUrl } from "@/utils/url/utils";
import { openEtendoViewPopup } from "@/utils/menu/openEtendoView";
import type { ExtendedMenu } from "@/utils/menu/menuItemDispatch";
import { MENU_ITEM_TYPES } from "@/utils/menu/menuItemTypes";
import {
  getManualProcessConfig,
  getManualProcessUrl,
  isClassicProcessMenuItem,
  openClassicProcessUrl,
  openLegacyManualProcess,
} from "@/utils/menu/legacyMenuEntry";

/**
 * Returns the opener of the menu entries served by Etendo Classic:
 * 1. Process / Form entries: their Classic form in a popup.
 * 2. ProcessManual / Report entries: Etendo Classic in a popup or a new tab.
 * 3. View entries: the OpenUI view in a Classic popup.
 *
 * The opener returns `true` when it opened the entry, and `false` for any other entry (windows,
 * external links, process definitions...), so the caller goes on with its own navigation.
 */
export const useOpenLegacyMenuEntry = () => {
  const { t } = useTranslation();
  const token = useUserStore((s) => s.token);
  const { config } = useRuntimeConfig();
  const baseUrl = config?.etendoClassicHost || "";

  /** Opens a ProcessManual / Report entry in Etendo Classic (popup or new tab). */
  const openClassicProcess = useCallback(
    (item: ExtendedMenu, processUrl: string) => {
      const classicUrl = buildEtendoClassicBookmarkUrl({
        baseUrl,
        processUrl,
        tabTitle: item.name,
        token: token,
        kioskMode: true,
      });
      const popupBlockedTexts = {
        title: t("processModal.gridToolbar.openLegacyReport.popupBlockedTitle"),
        openLabel: t("processModal.gridToolbar.openLegacyReport.openManually"),
      };
      openClassicProcessUrl(classicUrl, item.isModalProcess, popupBlockedTexts);
    },
    [token, baseUrl, t]
  );

  return useCallback(
    (item: ExtendedMenu): boolean => {
      // Handle legacy manual processes (Form) as external popup
      const processConfig = getManualProcessConfig(item, token, baseUrl);
      if (processConfig) {
        openLegacyManualProcess(processConfig.url, {
          title: t("drawer.legacyWindowPopupBlocked"),
          openLabel: t("drawer.openLegacyWindow"),
        });
        return true;
      }

      // Handle ProcessManual / Report items - open in Etendo Classic
      const processUrl = getManualProcessUrl(item);
      if (isClassicProcessMenuItem(item) && processUrl) {
        openClassicProcess(item, processUrl);
        return true;
      }

      // Handle View items — open as OpenUI view in Classic (popup window, same as legacy modal processes)
      if (item.type === MENU_ITEM_TYPES.VIEW && item.viewId) {
        openEtendoViewPopup({ baseUrl, viewId: item.viewId, token });
        return true;
      }

      return false;
    },
    [token, baseUrl, t, openClassicProcess]
  );
};
