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

import { useCallback, useEffect, useMemo } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { FavoritesWidgetData } from "@workspaceui/api-client/src/api/dashboard";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { showWindow } from "@/utils/window/showWindow";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { usePrefetchWindowOnHover } from "@/hooks/usePrefetchWindowOnHover";
import { WIDGET_CHIP_CLASSES, WIDGET_EMPTY_TEXT_CLASSES } from "./chipClasses";
import { useTranslation } from "@/hooks/useTranslation";
import { useLiveMenu } from "@/hooks/useLiveMenu";
import { useEntryUnavailableNotice } from "@/hooks/useEntryUnavailableNotice";
import { isStoredMenuEntryAvailable, toFavoriteMenuEntry } from "@/utils/menu/menuAvailability";

interface FavoritesRendererProps {
  data: FavoritesWidgetData;
}

export default function FavoritesRenderer({ data }: FavoritesRendererProps) {
  const { t } = useTranslation();
  const seed = useFavoritesStore((s) => s.seed);
  const prefetchOnHover = usePrefetchWindowOnHover();

  useEffect(() => {
    seed(data.items);
  }, [seed, data.items]);

  const notifyEntryUnavailable = useEntryUnavailableNotice();
  const menu = useLiveMenu();

  // Favorites the role's menu no longer has are not offered; they are kept, in case access comes back (ETP-6431).
  const items = useMemo(
    () => data.items.filter((item) => isStoredMenuEntryAvailable(menu, toFavoriteMenuEntry(item))),
    [data.items, menu]
  );

  const handleClick = useCallback(
    (windowId: string, label: string) => {
      // The menu may have changed since the list was drawn: never open a window the role can no longer open.
      if (!isStoredMenuEntryAvailable(Metadata.getCachedMenu(), toFavoriteMenuEntry({ windowId }))) {
        notifyEntryUnavailable();
        return;
      }
      const windowIdentifier = getNewWindowIdentifier(windowId);
      showWindow({ windowId, windowIdentifier, windowData: { title: label, initialized: true } });
    },
    [notifyEntryUnavailable]
  );

  if (items.length === 0) {
    return (
      <p className={WIDGET_EMPTY_TEXT_CLASSES} data-testid="FavoritesRenderer__empty">
        {t("dashboard.widget.emptyFavorites")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="FavoritesRenderer__list">
      {items.map((item) => (
        <button
          key={item.windowId}
          type="button"
          onClick={() => handleClick(item.windowId, item.label)}
          onMouseEnter={() => prefetchOnHover(item.windowId)}
          onFocus={() => prefetchOnHover(item.windowId)}
          className={WIDGET_CHIP_CLASSES}
          title={item.label}
          data-testid={`FavoritesRenderer__item_${item.windowId}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
