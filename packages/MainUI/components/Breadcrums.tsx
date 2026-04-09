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
  const { activeWindow, getTabFormState, clearTabFormState, setAllWindowsInactive } = useWindowContext();
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

  // Level 1 tab derived from navigation state
  const level1TabId = activeTabsByLevel?.get(1);
  const level1Tab = level1TabId ? allTabsFormatted.find((t) => t.id === level1TabId) : undefined;
  const level1RecordId = activeWindow?.tabs?.[level1TabId ?? ""]?.selectedRecord;

  const currentRecordId = useMemo(() => {
    return activeWindow?.tabs[currentTab?.id || ""]?.selectedRecord;
  }, [activeWindow, currentTab?.id]);

  // useCurrentRecord calls — ALWAYS unconditional (React hook rules)
  const { record } = useCurrentRecord({
    tab: currentTab,
    recordId: currentRecordId,
  });

  const { record: level1Record } = useCurrentRecord({
    tab: level1Tab,
    recordId: level1RecordId,
  });

  // Retains the last known valid _identifier so the breadcrumb doesn't go blank
  // during the brief window while a new record is being fetched after a clone.
  const lastValidLabelRef = useRef<string | undefined>(undefined);

  // Retains the last known valid _identifier for Level 1 breadcrumb item.
  // Reset to undefined when level1RecordId becomes falsy to prevent stale labels.
  const lastValidLabelLevel1Ref = useRef<string | undefined>(undefined);

  const isNewRecord = useCallback(() => pathname.includes("/NewRecord"), [pathname]);

  const handleWindowTitleClick = useCallback(() => {
    // 1. Collapse Level 1 and beyond
    setActiveLevel(0);
    // 2. Set focus to Level 0
    if (level0TabId) setFocus(level0TabId);
    // 3. Clear Level 0 form state (return to Grid view)
    if (windowIdentifier && currentTab?.id) {
      clearTabFormState(windowIdentifier, currentTab.id);
    }
    // 4. Also clear Level 1 form state to prevent stale state on re-open
    if (windowIdentifier && level1TabId) {
      clearTabFormState(windowIdentifier, level1TabId);
    }
    // 5. Clear graph selections (existing pattern from handleWindowClick)
    if (currentTab && graph) {
      graph.clear(currentTab);
      graph.clearSelected(currentTab);
    }
  }, [setActiveLevel, setFocus, level0TabId, windowIdentifier, currentTab, level1TabId, clearTabFormState, graph]);

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    if (windowId && window && windowIdentifier) {
      items.push({
        id: windowId,
        label: String(window.window$_identifier || window.name || t("common.loading")),
        onClick: handleWindowTitleClick,
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
      const currentRecordIdLocal = tabFormState?.recordId || "";
      const currentLabel = record?._identifier?.toString();

      // If we navigated away from the record, clear the persisted label
      if (!currentRecordIdLocal) {
        lastValidLabelRef.current = undefined;
      }
      // Keep the ref updated whenever we have a fresh label
      if (currentLabel) {
        lastValidLabelRef.current = currentLabel;
      }
      // Fall back to the last known label while the new record is still loading
      const displayLabel = currentLabel ?? (currentRecordIdLocal ? lastValidLabelRef.current : undefined);

      if (currentRecordIdLocal && displayLabel && currentRecordIdLocal !== NEW_RECORD_ID) {
        items.push({
          id: currentRecordIdLocal.toString(),
          label: displayLabel,
          onClick: () => {
            if (level0TabId) setFocus(level0TabId);
          },
        });
      }
    }

    // Level 1 record item — only when level1TabId is defined and we have an identifier
    if (level1TabId) {
      const level1Label = level1Record?._identifier?.toString();

      // Keep ref updated; reset when record goes away
      if (!level1RecordId) {
        lastValidLabelLevel1Ref.current = undefined;
      }
      if (level1Label) {
        lastValidLabelLevel1Ref.current = level1Label;
      }

      const displayLevel1Label = level1Label ?? lastValidLabelLevel1Ref.current;

      if (displayLevel1Label) {
        items.push({
          id: `level1-${level1TabId}`,
          label: displayLevel1Label,
          onClick: () => setFocus(level1TabId),
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
    level1Record?._identifier,
    level1TabId,
    level1RecordId,
    level0TabId,
    isNewRecord,
    t,
    handleWindowTitleClick,
    getTabFormState,
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
