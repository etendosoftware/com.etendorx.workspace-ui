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

import { ALERT_COUNT_MESSAGE_ACTION, ALERT_COUNT_MESSAGE_TYPE } from "./constants";

/**
 * Returns the origin of a URL (e.g. the classic host), or an empty string when it is not a valid URL.
 *
 * @param url - Absolute URL
 */
export function getOrigin(url?: string): string {
  if (!url) {
    return "";
  }
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * Reads the pending alerts count posted by the classic Alert Management popup.
 *
 * @param event - Received window message
 * @param classicOrigin - Origin of the classic host, the only accepted sender
 * @returns The posted count, or `null` when the message is not a valid alert count message
 */
export function readAlertCountMessage(event: MessageEvent, classicOrigin: string): number | null {
  if (!classicOrigin || event.origin !== classicOrigin) {
    return null;
  }
  const data = event.data;
  if (data?.type !== ALERT_COUNT_MESSAGE_TYPE || data.action !== ALERT_COUNT_MESSAGE_ACTION) {
    return null;
  }
  const count = data.payload?.cnt;
  if (typeof count !== "number") {
    return null;
  }
  return count;
}
