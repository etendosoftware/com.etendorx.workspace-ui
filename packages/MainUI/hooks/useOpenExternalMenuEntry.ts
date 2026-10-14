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
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useWindowStore } from "@/stores/windowStore";
import { notifyReportPopupBlocked } from "@/utils/reportPopup";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import {
  buildExternalPageWindowId,
  normalizeExternalUrl,
  openUrlInNewBrowserTab,
} from "@/utils/menu/externalMenuEntry";

/** Identifier of the already open in-app tab for the given `windowId`, if any. */
const findOpenWindowIdentifier = (windowId: string): string | undefined =>
  Object.values(useWindowStore.getState().windows).find((win) => win.windowId === windowId)?.windowIdentifier;

/**
 * Returns the opener of External (external link) menu entries, mirroring Classic:
 * - `openLinkInBrowser` → the URL opens in a new browser tab; when the browser blocks it, a
 *   notice offers to open it manually.
 * - otherwise → the URL is embedded in its own in-app tab. Reopening the same entry focuses the
 *   tab already open instead of duplicating it.
 *
 * Entries without a usable URL are ignored, so navigation never breaks.
 */
export const useOpenExternalMenuEntry = () => {
  const { t } = useTranslation();
  const setWindowActive = useWindowStore((s) => s.setWindowActive);

  const openInBrowser = useCallback(
    (url: string) => {
      if (openUrlInNewBrowserTab(url)) return;
      notifyReportPopupBlocked(() => openUrlInNewBrowserTab(url), {
        title: t("drawer.externalLinkPopupBlocked"),
        openLabel: t("drawer.openExternalLink"),
      });
    },
    [t]
  );

  const openInApp = useCallback(
    (item: Menu, url: string) => {
      const windowId = buildExternalPageWindowId(item.id);
      const openWindowIdentifier = findOpenWindowIdentifier(windowId);
      if (openWindowIdentifier) {
        setWindowActive({ windowIdentifier: openWindowIdentifier });
        return;
      }
      setWindowActive({
        windowIdentifier: getNewWindowIdentifier(windowId),
        windowData: { title: item.name, initialized: true, externalUrl: url },
      });
    },
    [setWindowActive]
  );

  return useCallback(
    (item: Menu) => {
      const url = normalizeExternalUrl(item.url);
      if (!url) {
        console.warn(`External menu entry ${item.id} has no URL to open`);
        return;
      }
      if (item.openLinkInBrowser) {
        openInBrowser(url);
        return;
      }
      openInApp(item, url);
    },
    [openInBrowser, openInApp]
  );
};
