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

import { useCallback, useEffect } from "react";
import type { FavoritesWidgetData } from "@workspaceui/api-client/src/api/dashboard";
import { useWindowContext } from "@/contexts/window";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { useFavoritesContext } from "@/contexts/favorites";

interface FavoritesRendererProps {
  data: FavoritesWidgetData;
}

export default function FavoritesRenderer({ data }: FavoritesRendererProps) {
  const { setWindowActive } = useWindowContext();
  const { seed } = useFavoritesContext();

  useEffect(() => {
    seed(data.items);
  }, [seed, data.items]);

  const handleClick = useCallback(
    (windowId: string, label: string) => {
      const windowIdentifier = getNewWindowIdentifier(windowId);
      setWindowActive({ windowIdentifier, windowData: { title: label, initialized: true } });
    },
    [setWindowActive]
  );

  if (data.items.length === 0) {
    return (
      <p className="text-sm text-white/50" data-testid="FavoritesRenderer__empty">
        —
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="FavoritesRenderer__list">
      {data.items.map((item) => (
        <button
          key={item.windowId}
          type="button"
          onClick={() => handleClick(item.windowId, item.label)}
          className="rounded-full px-3 py-1 text-sm font-medium bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-colors cursor-pointer"
          data-testid={`FavoritesRenderer__item_${item.windowId}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
