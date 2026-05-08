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
import { useLocalStorage } from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";
import type { RecentItem } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserContext } from "@/hooks/useUserContext";
import { useWindowContext } from "@/contexts/window";
import { getNewWindowIdentifier } from "@/utils/window/utils";

export default function RecentlyViewedRenderer() {
  const { t } = useTranslation();
  const { currentRole } = useUserContext();
  const { setWindowActive } = useWindowContext();
  const [recentlyViewedItems] = useLocalStorage<Record<string, RecentItem[]>>("recentlyViewedItems", {});

  const roleId = currentRole?.id ?? "";
  const items = roleId ? (recentlyViewedItems[roleId] ?? []) : [];

  const handleClick = useCallback(
    (item: RecentItem) => {
      const windowId = item.windowId ?? item.id;
      if (!windowId) return;
      const windowIdentifier = getNewWindowIdentifier(windowId);
      setWindowActive({ windowIdentifier, windowData: { title: item.name, initialized: true } });
    },
    [setWindowActive]
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
