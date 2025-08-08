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

export const useRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openWindow, buildURL, getNextOrder, windows, openWindowAndSelect } = useMultiWindowURL();
  const { getWindowMetadata, loadWindowData } = useMetadataContext();

  const handleAction = useCallback(
    async (
      windowId: string | undefined,
      windowIdentifier: string | undefined,
      selectedRecordId?: string
    ) => {
      if (!windowId) {
        console.warn("No windowId found");
        return;
      }

      const isInWindowRoute = pathname.includes("window");

      // If a record id is provided, attempt to preselect on target window's root tab
      if (selectedRecordId) {
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
            openWindow(windowId);
          }
          return;
        }

        const baseWindow = {
          windowId,
          window_identifier: windowIdentifier || windowId,
          isActive: true,
          order: getNextOrder(windows),
          title: windowIdentifier || windowId,
          selectedRecords: targetTabId ? { [targetTabId]: selectedRecordId } : {},
          tabFormStates:
            targetTabId && isLinkedLabelOpenInForm()
              ? { [targetTabId]: { recordId: selectedRecordId, mode: "form", formMode: "edit" } }
              : {},
        } as any;

        const targetURL = buildURL([baseWindow]);
        router.push(targetURL);
        return;
      }

      // Default behavior (no preselection)
      if (isInWindowRoute) {
        openWindow(windowId);
        return;
      }

      const newWindow = {
        windowId,
        window_identifier: windowIdentifier || windowId,
        isActive: true,
        order: getNextOrder(windows),
        title: windowIdentifier || windowId,
        selectedRecords: {},
        tabFormStates: {},
      };

      const targetURL = buildURL([newWindow]);
      router.push(targetURL);
    },
    [router, pathname, windows, buildURL, openWindow, openWindowAndSelect, getNextOrder, getWindowMetadata, loadWindowData]
  );

  const handleClickRedirect = useCallback(
    (e: React.MouseEvent, windowId: string | undefined, windowIdentifier: string | undefined, selectedRecordId?: string) => {
      e.stopPropagation();
      e.preventDefault();
      void handleAction(windowId, windowIdentifier, selectedRecordId);
    },
    [handleAction]
  );

  const handleKeyDownRedirect = useCallback(
    (e: React.KeyboardEvent, windowId: string | undefined, windowIdentifier: string | undefined, selectedRecordId?: string) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        void handleAction(windowId, windowIdentifier, selectedRecordId);
      }
    },
    [handleAction]
  );

  return {
    handleClickRedirect,
    handleKeyDownRedirect,
  };
};
