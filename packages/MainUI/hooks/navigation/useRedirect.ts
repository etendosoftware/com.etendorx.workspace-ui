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

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { isLinkedLabelOpenInForm } from "@/utils/prefs";
import { getNewWindowIdentifier } from "@/utils/url/utils";

export const useRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openWindow, buildURL, openWindowAndSelect } = useMultiWindowURL();
  const { getWindowMetadata, loadWindowData } = useMetadataContext();

  const createBaseWindow = useCallback(
    (windowId: string, windowIdentifier?: string) => ({
      windowId,
      window_identifier: windowIdentifier || windowId,
      isActive: true,
      title: windowIdentifier || windowId,
      selectedRecords: {},
      tabFormStates: {},
    }),
    []
  );

  const handleRecordSelection = useCallback(
    async (
      windowId: string,
      windowIdentifier: string | undefined,
      selectedRecordId: string,
      isInWindowRoute: boolean
    ) => {
      let targetTabId: string | undefined;
      const meta = getWindowMetadata(windowId) || (await loadWindowData(windowId).catch(() => undefined));

      if (meta?.tabs?.length) {
        const rootTab = meta.tabs.find((t) => t.tabLevel === 0) || meta.tabs[0];
        targetTabId = rootTab?.id;
      }

      if (isInWindowRoute) {
        if (targetTabId) {
          openWindowAndSelect(windowId, {
            selection: {
              tabId: targetTabId,
              recordId: selectedRecordId,
              openForm: isLinkedLabelOpenInForm(),
            },
          });
        } else {
          const newWindowIdentifier = getNewWindowIdentifier(windowId);
          openWindow(windowId, newWindowIdentifier);
        }
        return;
      }

      const baseWindow = createBaseWindow(windowId, windowId); // Use windowId as identifier for URL params
      if (windowIdentifier) {
        baseWindow.title = windowIdentifier; // Use windowIdentifier as display title
      }
      if (targetTabId) {
        baseWindow.selectedRecords = { [targetTabId]: selectedRecordId };
        if (isLinkedLabelOpenInForm()) {
          baseWindow.tabFormStates = {
            [targetTabId]: {
              recordId: selectedRecordId,
              mode: "form",
              formMode: "edit",
            },
          };
        }
      }

      const targetURL = buildURL([baseWindow]);
      router.push(targetURL);
    },
    [getWindowMetadata, loadWindowData, openWindowAndSelect, openWindow, createBaseWindow, buildURL, router]
  );

  const handleAction = useCallback(
    async (windowId: string | undefined, windowIdentifier: string | undefined, selectedRecordId?: string) => {
      if (!windowId) {
        console.warn("No windowId found");
        return;
      }

      const isInWindowRoute = pathname.includes("window");

      if (selectedRecordId) {
        await handleRecordSelection(windowId, windowIdentifier, selectedRecordId, isInWindowRoute);
        return;
      }

      // Default behavior (no preselection)
      if (isInWindowRoute) {
        const newWindowIdentifier = getNewWindowIdentifier(windowId);
        openWindow(windowId, newWindowIdentifier);
        return;
      }

      const newWindow = createBaseWindow(windowId, windowIdentifier);
      const targetURL = buildURL([newWindow]);
      router.push(targetURL);
    },
    [router, pathname, handleRecordSelection, openWindow, createBaseWindow, buildURL]
  );

  const handleClickRedirect = useCallback(
    (
      e: React.MouseEvent,
      windowId: string | undefined,
      windowIdentifier: string | undefined,
      selectedRecordId?: string
    ) => {
      e.stopPropagation();
      e.preventDefault();
      handleAction(windowId, windowIdentifier, selectedRecordId);
    },
    [handleAction]
  );

  const handleKeyDownRedirect = useCallback(
    (
      e: React.KeyboardEvent,
      windowId: string | undefined,
      windowIdentifier: string | undefined,
      selectedRecordId?: string
    ) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        handleAction(windowId, windowIdentifier, selectedRecordId);
      }
    },
    [handleAction]
  );

  return {
    handleClickRedirect,
    handleKeyDownRedirect,
  };
};
