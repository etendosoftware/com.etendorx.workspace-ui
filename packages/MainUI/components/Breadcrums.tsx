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

import { useCallback, useMemo, useRef } from "react";
import Breadcrumb from "@workspaceui/componentlibrary/src/components/Breadcrums";
import type { BreadcrumbItem } from "@workspaceui/componentlibrary/src/components/Breadcrums/types";
import { usePathname } from "next/navigation";
import type React from "react";
import { ROUTE_IDS } from "../constants/breadcrumb";
import { useMetadataContext } from "../hooks/useMetadataContext";
import { useTranslation } from "../hooks/useTranslation";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useSelected } from "@/hooks/useSelected";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { useCurrentRecord } from "@/hooks/useCurrentRecord";
import { useWindowContext } from "@/contexts/window";
import { useFavoritesContext } from "@/contexts/favorites";

interface BreadcrumbProps {
  allTabs: Tab[][];
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const AppBreadcrumb: React.FC<BreadcrumbProps> = ({ allTabs }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { window, windowId, windowIdentifier } = useMetadataContext();
  const { activeWindow, getTabFormState, clearTabFormState, setAllWindowsInactive } = useWindowContext();
  const { isFavorite, toggle, menuIdByWindowId } = useFavoritesContext();
  const { graph } = useSelected();

  const allTabsFormatted = useMemo(() => allTabs.flat(), [allTabs]);
  const currentTab = useMemo(() => {
    if (!windowId || allTabsFormatted.length === 0) return undefined;

    const normalizedWindowId = windowId.split("_")[0];

    let tab = allTabsFormatted.find((tab) => tab.window === normalizedWindowId);

    if (!tab && window && window.window$_identifier === normalizedWindowId) {
      tab = allTabsFormatted[0];
    }

    if (!tab) {
      tab = allTabsFormatted.find((t) => t.window$_identifier === normalizedWindowId);
    }

    return tab;
  }, [allTabsFormatted, windowId, window]);

  const currentRecordId = useMemo(() => {
    return activeWindow?.tabs[currentTab?.id || ""]?.selectedRecord;
  }, [activeWindow, currentTab?.id]);

  const { record } = useCurrentRecord({
    tab: currentTab,
    recordId: currentRecordId,
  });

  // Retains the last known valid _identifier so the breadcrumb doesn't go blank
  // during the brief window while a new record is being fetched after a clone.
  const lastValidLabelRef = useRef<string | undefined>(undefined);

  const isNewRecord = useCallback(() => pathname.includes("/NewRecord"), [pathname]);

  const handleWindowClick = useCallback(
    (windowIdentifier: string) => {
      const allTabsFormatted = allTabs.flat();
      const currentTab = allTabsFormatted.find((tab) => tab.window === windowId);
      if (windowIdentifier && currentTab && currentTab.id) {
        clearTabFormState(windowIdentifier, currentTab.id);
      }
      if (currentTab && graph) {
        graph.clear(currentTab);
        graph.clearSelected(currentTab);
      }
    },
    [clearTabFormState, allTabs, graph, windowId]
  );

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    if (windowId && window && windowIdentifier) {
      items.push({
        id: windowId,
        label: String(window.window$_identifier || window.name || t("common.loading")),
        onClick: () => handleWindowClick(windowIdentifier),
      });
    }

    if (isNewRecord()) {
      items.push({
        id: ROUTE_IDS.NEW_RECORD,
        label: t("breadcrumb.newRecord"),
      });
    }

    if (currentTab) {
      const tabFormState = windowIdentifier ? getTabFormState(windowIdentifier, currentTab.id) : undefined;
      const currentRecordId = tabFormState?.recordId || "";
      const currentLabel = record?._identifier?.toString();

      // If we navigated away from the record, clear the persisted label
      if (!currentRecordId) {
        lastValidLabelRef.current = undefined;
      }
      // Keep the ref updated whenever we have a fresh label
      if (currentLabel) {
        lastValidLabelRef.current = currentLabel;
      }
      // Fall back to the last known label while the new record is still loading
      const displayLabel = currentLabel ?? (currentRecordId ? lastValidLabelRef.current : undefined);

      if (currentRecordId && displayLabel && currentRecordId !== NEW_RECORD_ID) {
        items.push({
          id: currentRecordId.toString(),
          label: displayLabel,
        });
      }
    }

    return items;
  }, [
    windowId,
    windowIdentifier,
    window,
    currentTab,
    record?._identifier,
    isNewRecord,
    t,
    handleWindowClick,
    getTabFormState,
  ]);

  const handleHomeClick = useCallback(() => {
    setAllWindowsInactive();
  }, [setAllWindowsInactive]);

  const windowMenuId = windowId ? menuIdByWindowId.get(windowId) : undefined;
  const isCurWindowFav = windowId ? isFavorite(windowId) : false;

  const handleFavToggle = useCallback(() => {
    if (windowMenuId && windowId) toggle(windowMenuId, windowId);
  }, [windowMenuId, windowId, toggle]);

  return (
    <div className="flex items-center gap-1 w-full h-8">
      <Breadcrumb onHomeClick={handleHomeClick} items={breadcrumbItems || []} data-testid="Breadcrumb__50ef19" />
      {windowMenuId && (
        <button
          type="button"
          onClick={handleFavToggle}
          className={`shrink-0 p-1 rounded transition-all ${
            isCurWindowFav ? "text-yellow-400" : "text-baseline-40 hover:text-yellow-400"
          }`}
          title={isCurWindowFav ? "Remove from favorites" : "Add to favorites"}
          data-testid="Breadcrumb__favorite_toggle">
          <StarIcon filled={isCurWindowFav} data-testid="StarIcon__50ef19" />
        </button>
      )}
    </div>
  );
};

export default AppBreadcrumb;
