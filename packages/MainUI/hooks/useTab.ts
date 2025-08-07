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

import { logger } from "@/utils/logger";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useTab(tabId?: string) {
  const [loading, setLoading] = useState(!!tabId);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Tab>();

  const load = useCallback(async () => {
    try {
      if (!tabId) {
        return;
      }

      setLoading(true);
      setError(undefined);

      const data = await Metadata.getTab(tabId);

      setData(data);
      setLoaded(true);
    } catch (e) {
      logger.warn(e);

      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [tabId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(() => ({ loading, data, error, loaded, load }), [data, error, load, loaded, loading]);
}
