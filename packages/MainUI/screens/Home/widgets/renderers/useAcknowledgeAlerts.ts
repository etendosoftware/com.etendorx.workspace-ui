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

import { useCallback, useState } from "react";
import { acknowledgeAlerts } from "@workspaceui/api-client/src/api/dashboard";
import { ALERTS_CHANGED_EVENT } from "@/utils/alerts/constants";
import { logger } from "@/utils/logger";

/**
 * Marks alerts as read from the notifications widget, then reloads the widget and tells the alerts indicator of
 * the header to count again.
 *
 * @param onDataChanged reloads the widget data
 * @returns the action and whether a request is running
 */
export function useAcknowledgeAlerts(onDataChanged?: () => Promise<void> | void) {
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const acknowledge = useCallback(
    async (alertIds: string[]) => {
      if (alertIds.length === 0) return;
      setIsAcknowledging(true);
      try {
        await acknowledgeAlerts(alertIds);
        window.dispatchEvent(new Event(ALERTS_CHANGED_EVENT));
        await onDataChanged?.();
      } catch (err) {
        logger.warn("[NotificationRenderer] Failed to mark alerts as read:", err);
      } finally {
        setIsAcknowledging(false);
      }
    },
    [onDataChanged]
  );

  return { acknowledge, isAcknowledging };
}
