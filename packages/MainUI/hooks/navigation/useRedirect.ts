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
import { useWindowContext } from "@/contexts/window";
import { getNewWindowIdentifier, createDefaultTabState } from "@/utils/window/utils";
import { FORM_MODES, TAB_MODES } from '@/utils/url/constants';
import { TabState } from "@/utils/window/constants";

interface HandleActionProps {
  windowId: string,
  windowTitle: string,
  referencedTabId: string,
  selectedRecordId?: string;
  tabLevel?: number;
}

interface HandleClickRedirectProps {
  e: React.MouseEvent;
  windowId: string;
  windowTitle: string;
  referencedTabId: string,
  selectedRecordId?: string;
  tabLevel?: number;
}

interface HandleKeyDownRedirectProps {
  e: React.KeyboardEvent;
  windowId: string;
  windowTitle: string;
  referencedTabId: string,
  selectedRecordId?: string;
  tabLevel?: number;
}

export const useRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openWindow, buildURL } = useMultiWindowURL();
  const { setWindowActive } = useWindowContext();

  const createBaseWindow = useCallback(
    (windowId: string, windowIdentifier?: string) => ({
      windowId,
      windowIdentifier: windowIdentifier || windowId,
      isActive: true,
      title: windowIdentifier || windowId,
      navigation: {
        activeLevels: [],
        activeTabsByLevel: new Map<number, string>(),
        initialized: false,
      },
      tabs: {}
    }),
    []
  );

  const handleAction = useCallback(
    async ({ windowId, windowTitle, referencedTabId, selectedRecordId, tabLevel = 0 }: HandleActionProps) => {
      if (!windowId) {
        console.warn("No windowId found");
        return;
      }

      const isInWindowRoute = pathname.includes("window");

      const newWindowIdentifier = getNewWindowIdentifier(windowId);
      const defaultTabState = createDefaultTabState(tabLevel);
      const tabs = {
        [referencedTabId]: {
          ...defaultTabState,
          form: {
            recordId: selectedRecordId,
            mode: TAB_MODES.FORM,
            formMode: FORM_MODES.EDIT,
          },
          selectedRecord: selectedRecordId,
        } as TabState
      }
      const windowData = { title: windowTitle, tabs };
      setWindowActive({ windowIdentifier: newWindowIdentifier, windowData });

      // Default behavior (no preselection)
      if (isInWindowRoute) {
        openWindow(windowId, newWindowIdentifier);
        return;
      }

      const newWindow = createBaseWindow(windowId, newWindowIdentifier);
      const targetURL = buildURL([newWindow]);
      router.push(targetURL);
    },
    [router, pathname, openWindow, createBaseWindow, setWindowActive, buildURL]
  );

  const handleClickRedirect = useCallback(
    ({ e, windowId, windowTitle, referencedTabId, selectedRecordId, tabLevel }: HandleClickRedirectProps) => {
      e.stopPropagation();
      e.preventDefault();
      handleAction({ windowId, windowTitle, referencedTabId, selectedRecordId, tabLevel });
    },
    [handleAction]
  );

  const handleKeyDownRedirect = useCallback(
    ({ e, windowId, windowTitle, referencedTabId, selectedRecordId, tabLevel }: HandleKeyDownRedirectProps) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        handleAction({ windowId, windowTitle, referencedTabId, selectedRecordId, tabLevel });
      }
    },
    [handleAction]
  );

  return {
    handleClickRedirect,
    handleKeyDownRedirect,
  };
};
