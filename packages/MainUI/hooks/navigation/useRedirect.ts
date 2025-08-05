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

export const useRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openWindow, buildURL, getNextOrder, windows } = useMultiWindowURL();

  const handleAction = useCallback(
    (windowId: string | undefined, windowIdentifier: string | undefined) => {
      if (!windowId) {
        console.warn("No windowId found");
        return;
      }

      const isInWindowRoute = pathname.includes("window");

      if (isInWindowRoute) {
        openWindow(windowId);
      } else {
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
      }
    },
    [router, pathname, windows, buildURL, openWindow, getNextOrder]
  );

  const handleClickRedirect = useCallback(
    (e: React.MouseEvent, windowId: string | undefined, windowIdentifier: string | undefined) => {
      e.stopPropagation();
      e.preventDefault();
      handleAction(windowId, windowIdentifier);
    },
    [handleAction]
  );

  const handleKeyDownRedirect = useCallback(
    (e: React.KeyboardEvent, windowId: string | undefined, windowIdentifier: string | undefined) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        handleAction(windowId, windowIdentifier);
      }
    },
    [handleAction]
  );

  return {
    handleClickRedirect,
    handleKeyDownRedirect,
  };
};
