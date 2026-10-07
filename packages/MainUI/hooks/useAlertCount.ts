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

import { useEffect, useState } from "react";
import { fetchAlertCount } from "@/utils/alerts/fetchAlertCount";
import { ALERTS_POLL_DELAY_MS } from "@/utils/alerts/constants";

/**
 * Polls the pending alerts count like classic `OB.AlertManager`: once right away and then
 * {@link ALERTS_POLL_DELAY_MS} after each response (failed polls are rescheduled too, keeping the
 * last known count). Polling restarts immediately when the role changes, since the count depends
 * on it, and stops when disabled or unmounted.
 *
 * @param enabled - Whether a session is active (no polling while logging in or logged out)
 * @param roleId - Current role id
 * @returns The last known pending alerts count, or `null` until the first successful response
 */
export function useAlertCount(enabled: boolean, roleId?: string): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      const nextCount = await fetchAlertCount();
      if (cancelled) {
        return;
      }
      if (nextCount !== null) {
        setCount(nextCount);
      }
      timer = setTimeout(poll, ALERTS_POLL_DELAY_MS);
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, roleId]);

  return count;
}
