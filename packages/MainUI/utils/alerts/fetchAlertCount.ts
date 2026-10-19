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

import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import { ALERT_ACTION_HANDLER, IGNORE_SESSION_TIMEOUT_PARAMS } from "./constants";

interface AlertCountResponse {
  cnt?: unknown;
}

/**
 * Asks the classic `AlertActionHandler` for the number of pending (NEW) alerts of the current
 * user/role. The handler also refreshes the session last ping, and the request is flagged so it
 * never extends the session inactivity timeout (same call as classic `OB.AlertManager.call`).
 *
 * @returns The pending alerts count, or `null` when the request fails or the response is unexpected
 */
export async function fetchAlertCount(): Promise<number | null> {
  const params = new URLSearchParams({ _action: ALERT_ACTION_HANDLER, ...IGNORE_SESSION_TIMEOUT_PARAMS });
  try {
    const { ok, data } = await Metadata.kernelClient.post(`?${params}`, {});
    const count = (data as AlertCountResponse | undefined)?.cnt;
    if (ok && typeof count === "number") {
      return count;
    }
    return null;
  } catch (error) {
    logger.warn("Failed to fetch the pending alerts count", error);
    return null;
  }
}
