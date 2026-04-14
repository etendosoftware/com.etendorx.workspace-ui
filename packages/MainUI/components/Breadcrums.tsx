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

// Maximum number of tab levels the breadcrumb supports.
// React hooks must be called the same number of times every render,
// so we pre-allocate this many useCurrentRecord calls.
const MAX_BREADCRUMB_LEVELS = 5;

const AppBreadcrumb: React.FC<BreadcrumbProps> = ({ allTabs }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { window, windowId, windowIdentifier } = useMetadataContext();
  const { activeWindow, setAllWindowsInactive } = useWindowContext();
  const { graph } = useSelected();
  const { setFocus } = useFocusContext();

  const { setActiveLevel, activeTabsByLevel, activeLevels } = useTableStatePersistenceTab({
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

  const level0TabId = activeTabsByLevel?.get(0) ?? currentTab?.id;

  // Build tab object for each level. For each level:
  //   - Level 0: use activeTabsByLevel.get(0) ?? currentTab
  //   - Level N≥1: use activeTabsByLevel.get(N) first; if absent (child tab was auto-shown
  //     without an explicit tab-header click), fall back to the first tab at that level
  //     that currently has a selected record in activeWindow.tabs.
  const tabByLevel = useMemo(() => {
    const result: Array<Tab | undefined> = [];
    for (let i = 0; i < MAX_BREADCRUMB_LEVELS; i++) {
      const tabIdFromMap = i === 0 ? level0TabId : activeTabsByLevel?.get(i);
      if (tabIdFromMap) {
        const tab = allTabsFormatted.find((t) => t.id === tabIdFromMap);
        if (tab) {
          result.push(tab);
          continue;
        }
      }
      // Fallback for levels ≥ 1: find any tab at this level that has a selected record
      if (i > 0 && activeWindow?.tabs) {
        result.push(
          allTabsFormatted.find((t) => t.tabLevel === i && Boolean(activeWindow.tabs[t.id]?.selectedRecord))
        );
      } else {
        result.push(undefined);
      }
    }
    return result;
  }, [level0TabId, activeTabsByLevel, allTabsFormatted, activeWindow]);

  const recordIdByLevel = useMemo(
    () => tabByLevel.map((tab) => (tab?.id ? activeWindow?.tabs?.[tab.id]?.selectedRecord : undefined)),
    [tabByLevel, activeWindow]
  );

  // Fixed-count hook calls — React rules require the same number of hooks every render.
  // Slots beyond the active level count receive tab=undefined, recordId=undefined,
  // which useCurrentRecord handles gracefully (returns empty record).
  const { record: record0 } = useCurrentRecord({ tab: tabByLevel[0], recordId: recordIdByLevel[0] });
  const { record: record1 } = useCurrentRecord({ tab: tabByLevel[1], recordId: recordIdByLevel[1] });
  const { record: record2 } = useCurrentRecord({ tab: tabByLevel[2], recordId: recordIdByLevel[2] });
  const { record: record3 } = useCurrentRecord({ tab: tabByLevel[3], recordId: recordIdByLevel[3] });
  const { record: record4 } = useCurrentRecord({ tab: tabByLevel[4], recordId: recordIdByLevel[4] });

  // One ref slot per level to persist last-valid labels across render cycles during fetches
  const lastValidLabelsRef = useRef<Array<string | undefined>>(Array(MAX_BREADCRUMB_LEVELS).fill(undefined));

  const isNewRecord = useCallback(() => pathname.includes("/NewRecord"), [pathname]);

  const handleWindowTitleClick = useCallback(() => {
    setActiveLevel(0);
    if (level0TabId) setFocus(level0TabId);
    if (currentTab && graph) {
      graph.clear(currentTab);
      graph.clearSelected(currentTab);
    }
  }, [setActiveLevel, setFocus, level0TabId, currentTab, graph]);

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];
    const recordsByLevel = [record0, record1, record2, record3, record4];

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

    // One item per level that has a selected record with a resolved identifier
    for (let i = 0; i < MAX_BREADCRUMB_LEVELS; i++) {
      const tab = tabByLevel[i];
      if (!tab) break; // No tab at this level — deeper levels are also absent

      const recordId = recordIdByLevel[i];
      if (!recordId || recordId === NEW_RECORD_ID) {
        lastValidLabelsRef.current[i] = undefined;
        continue;
      }

      const rawLabel = recordsByLevel[i]?._identifier?.toString();
      if (rawLabel) lastValidLabelsRef.current[i] = rawLabel;
      const displayLabel = rawLabel ?? lastValidLabelsRef.current[i];
      if (!displayLabel) continue;

      const tabId = tab.id;
      const levelIndex = i;
      items.push({
        id: `level${i}-${tabId}`,
        label: displayLabel,
        onClick: () => {
          setFocus(tabId);
          if (!activeLevels.includes(levelIndex)) {
            setActiveLevel(levelIndex + 1, false);
          }
        },
      });
    }

    return items;
  }, [
    windowId,
    windowIdentifier,
    window,
    tabByLevel,
    recordIdByLevel,
    record0,
    record1,
    record2,
    record3,
    record4,
    isNewRecord,
    t,
    handleWindowTitleClick,
    setFocus,
    activeLevels,
    setActiveLevel,
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
