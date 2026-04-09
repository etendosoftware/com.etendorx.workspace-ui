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
import { useFocusContext } from "@/contexts/focus";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";

interface BreadcrumbProps {
  allTabs: Tab[][];
}

const AppBreadcrumb: React.FC<BreadcrumbProps> = ({ allTabs }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { window, windowId, windowIdentifier } = useMetadataContext();
  const { activeWindow, clearTabFormState, setAllWindowsInactive } = useWindowContext();
  const { graph } = useSelected();
  const { setFocus } = useFocusContext();

  const { setActiveLevel, activeTabsByLevel } = useTableStatePersistenceTab({
    windowIdentifier: windowIdentifier || "",
    tabId: "",
  });

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

  // Level 0 tab id (the current active Level 0 tab)
  const level0TabId = activeTabsByLevel?.get(0) ?? currentTab?.id;

  const MAX_BREADCRUMB_LEVELS = 5;

  // Build tab object for each level slot (fixed-size array, levels beyond activeTabsByLevel are undefined)
  const tabByLevel = useMemo(() => {
    const result: Array<Tab | undefined> = [];
    for (let i = 0; i < MAX_BREADCRUMB_LEVELS; i++) {
      const tabId = i === 0 ? level0TabId : activeTabsByLevel?.get(i);
      result.push(tabId ? allTabsFormatted.find((t) => t.id === tabId) : undefined);
    }
    return result;
  }, [level0TabId, activeTabsByLevel, allTabsFormatted]);

  // Build selectedRecord id for each level slot
  const recordIdByLevel = useMemo(
    () => tabByLevel.map((tab) => (tab?.id ? activeWindow?.tabs?.[tab.id]?.selectedRecord : undefined)),
    [tabByLevel, activeWindow]
  );

  // Fixed-count hook calls (React hooks rule: same count every render)
  // Slots beyond the active level count receive tab=undefined, recordId=undefined — useCurrentRecord handles this gracefully
  const { record: record0 } = useCurrentRecord({ tab: tabByLevel[0], recordId: recordIdByLevel[0] });
  const { record: record1 } = useCurrentRecord({ tab: tabByLevel[1], recordId: recordIdByLevel[1] });
  const { record: record2 } = useCurrentRecord({ tab: tabByLevel[2], recordId: recordIdByLevel[2] });
  const { record: record3 } = useCurrentRecord({ tab: tabByLevel[3], recordId: recordIdByLevel[3] });
  const { record: record4 } = useCurrentRecord({ tab: tabByLevel[4], recordId: recordIdByLevel[4] });

  const recordsByLevel = useMemo(
    () => [record0, record1, record2, record3, record4],
    [record0, record1, record2, record3, record4]
  );

  // Single Map ref for persisting last-valid labels across all N levels
  // (replaces the two per-level refs that existed before)
  const lastValidLabelByLevelRef = useRef<Map<number, string>>(new Map());

  const isNewRecord = useCallback(() => pathname.includes("/NewRecord"), [pathname]);

  const handleWindowTitleClick = useCallback(() => {
    // 1. Collapse all levels except Level 0
    setActiveLevel(0);
    // 2. Set focus to Level 0
    if (level0TabId) setFocus(level0TabId);
    // 3. Clear form state for ALL active levels
    if (windowIdentifier && activeTabsByLevel) {
      for (const tabId of activeTabsByLevel.values()) {
        clearTabFormState(windowIdentifier, tabId);
      }
    }
    // 4. Clear graph selections
    if (currentTab && graph) {
      graph.clear(currentTab);
      graph.clearSelected(currentTab);
    }
  }, [
    setActiveLevel,
    setFocus,
    level0TabId,
    windowIdentifier,
    currentTab,
    clearTabFormState,
    graph,
    activeTabsByLevel,
  ]);

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    // Window title (always first)
    if (windowId && window && windowIdentifier) {
      items.push({
        id: windowId,
        label: String(window.window$_identifier || window.name || t("common.loading")),
        onClick: handleWindowTitleClick,
      });
    }

    // "New Record" special case
    if (isNewRecord()) {
      items.push({
        id: ROUTE_IDS.NEW_RECORD,
        label: t("breadcrumb.newRecord"),
      });
    }

    // One breadcrumb item per level that has a selected record with an identifier
    for (let i = 0; i < MAX_BREADCRUMB_LEVELS; i++) {
      const tab = tabByLevel[i];
      if (!tab) break; // No tab at this level — all deeper levels are also absent

      const recordId = recordIdByLevel[i];
      const rawLabel = recordsByLevel[i]?._identifier?.toString();

      // Manage last-valid label: clear when record is gone, update when fresh label arrives
      if (!recordId) {
        lastValidLabelByLevelRef.current.delete(i);
      } else if (rawLabel) {
        lastValidLabelByLevelRef.current.set(i, rawLabel);
      }

      if (!recordId || recordId === NEW_RECORD_ID) continue;

      const displayLabel = rawLabel ?? lastValidLabelByLevelRef.current.get(i);
      if (!displayLabel) continue;

      const tabId = tab.id; // capture for closure
      items.push({
        id: `level${i}-${tabId}`,
        label: displayLabel,
        onClick: () => setFocus(tabId),
      });
    }

    return items;
  }, [
    windowId,
    windowIdentifier,
    window,
    tabByLevel,
    recordIdByLevel,
    recordsByLevel,
    isNewRecord,
    t,
    handleWindowTitleClick,
    setFocus,
  ]);

  const handleHomeClick = useCallback(() => {
    setAllWindowsInactive();
  }, [setAllWindowsInactive]);

  return (
    <div className="w-full h-8">
      <Breadcrumb onHomeClick={handleHomeClick} items={breadcrumbItems || []} data-testid="Breadcrumb__50ef19" />
    </div>
  );
};

export default AppBreadcrumb;
