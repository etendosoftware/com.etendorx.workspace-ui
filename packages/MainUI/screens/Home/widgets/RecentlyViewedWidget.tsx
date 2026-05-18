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

export default function RecentlyViewedWidget() {
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
      const newWindowIdentifier = getNewWindowIdentifier(windowId);
      setWindowActive({ windowIdentifier: newWindowIdentifier, windowData: { title: item.name, initialized: true } });
    },
    [setWindowActive]
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#0A0F1E] text-white p-5 h-full min-h-40">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold">{t("dashboard.recentlyViewed.title")}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-white/50">{t("dashboard.recentlyViewed.empty")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item)}
              className="rounded-full px-3 py-1 text-sm font-medium bg-white/10 hover:bg-white/15 text-baseline-0 border border-white/20 transition-colors cursor-pointer">
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
