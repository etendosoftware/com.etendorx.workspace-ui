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
