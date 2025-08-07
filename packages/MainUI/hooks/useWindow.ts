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

import { useCallback, useEffect, useMemo, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";

export function useWindow(windowId: string) {
  const [loading, setLoading] = useState(!!windowId);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);
  const [windowData, setWindowData] = useState(Metadata.getCachedWindow(windowId));

  const load = useCallback(async () => {
    try {
      if (!windowId) {
        return;
      }

      setLoading(true);
      setError(undefined);

      const data = await Metadata.getWindow(windowId);

      setWindowData(data);
      setLoaded(true);
    } catch (e) {
      logger.warn(e);

      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [windowId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(() => ({ loading, windowData, error, loaded, load }), [error, load, loaded, loading, windowData]);
}
