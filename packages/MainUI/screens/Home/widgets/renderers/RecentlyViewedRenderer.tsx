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

"use client";

import { useCallback } from "react";
import type { RecentItem } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/userStore";
import { useWindowStore } from "@/stores/windowStore";
import { useRecentItemsStore } from "@/stores/recentItemsStore";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { findExternalMenuEntry, isExternalMenuEntry } from "@/utils/menu/externalMenuEntry";
import { useOpenExternalMenuEntry } from "@/hooks/useOpenExternalMenuEntry";
import { useOpenLegacyMenuEntry } from "@/hooks/useOpenLegacyMenuEntry";
import { findLiveMenuEntry } from "@/utils/menu/legacyMenuEntry";
import { MENU_CLICK_INTENT_KINDS, resolveMenuClickIntent } from "@/utils/menu/menuItemDispatch";
import { MENU_ITEM_TYPES } from "@/utils/menu/menuItemTypes";

export default function RecentlyViewedRenderer() {
  const { t } = useTranslation();
  const currentRole = useUserStore((s) => s.currentRole);
  const setWindowActive = useWindowStore((s) => s.setWindowActive);
  const recentItems = useRecentItemsStore((s) => s.items);
  const openExternalMenuEntry = useOpenExternalMenuEntry();
  const openLegacyMenuEntry = useOpenLegacyMenuEntry();

  const items = currentRole?.id ? recentItems : [];

  /**
   * Opens a recent entry served by Etendo Classic (Form, ProcessManual, Report, View) the same way
   * the menu does, with the live menu entry so the form address resolved today is honored.
   *
   * @returns true when the entry was opened.
   */
  const openClassicRecentItem = useCallback(
    (item: RecentItem): boolean => {
      if (item.type === MENU_ITEM_TYPES.WINDOW) return false;
      const liveEntry = findLiveMenuEntry(Metadata.getCachedMenu(), item);
      if (!liveEntry) return false;
      // Process-like entries open in the process modal, which only the menu hosts.
      if (resolveMenuClickIntent(liveEntry).kind !== MENU_CLICK_INTENT_KINDS.NONE) return false;
      return openLegacyMenuEntry(liveEntry);
    },
    [openLegacyMenuEntry]
  );

  const handleClick = useCallback(
    (item: RecentItem) => {
      if (isExternalMenuEntry(item)) {
        // Prefer the live menu entry, so a URL changed since the visit is honored.
        openExternalMenuEntry(findExternalMenuEntry(Metadata.getCachedMenu(), item.id) ?? item);
        return;
      }
      if (openClassicRecentItem(item)) return;
      const windowId = item.windowId ?? item.id;
      if (!windowId) return;
      const windowIdentifier = getNewWindowIdentifier(windowId);
      setWindowActive({ windowIdentifier, windowData: { title: item.name, initialized: true } });
    },
    [setWindowActive, openExternalMenuEntry, openClassicRecentItem]
  );

  if (items.length === 0) {
    return (
      <p className="text-sm text-baseline-50" data-testid="RecentlyViewedRenderer__empty">
        {t("dashboard.recentlyViewed.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="RecentlyViewedRenderer__list">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handleClick(item)}
          className="rounded-full px-3 py-1 text-sm font-medium bg-transparent-neutral-5 hover:bg-transparent-neutral-10 text-baseline-100 border border-transparent-neutral-10 transition-colors cursor-pointer"
          data-testid={`RecentlyViewedRenderer__item_${item.id}`}>
          {item.name}
        </button>
      ))}
    </div>
  );
}
