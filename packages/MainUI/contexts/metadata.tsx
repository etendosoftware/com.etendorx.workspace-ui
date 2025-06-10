"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { type Etendo, Metadata } from "@workspaceui/api-client/src/api/metadata";
import { groupTabsByLevel } from "@workspaceui/api-client/src/utils/metadata";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { IMetadataContext } from "./types";
import { useDatasourceContext } from "./datasourceContext";
import { mapBy } from "@/utils/structures";
import { useQueryParams } from "@/hooks/useQueryParams";
import { logger } from "@/utils/logger";

export const MetadataContext = createContext({} as IMetadataContext);

export default function MetadataProvider({ children }: React.PropsWithChildren) {
  const { windowId } = useQueryParams<{ windowId: string }>();
  const [windowData, setWindowData] = useState<Etendo.WindowMetadata | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [groupedTabs, setGroupedTabs] = useState<Etendo.Tab[][]>([]);
  const tabs = useMemo<Record<string, Tab>>(
    () => (windowData?.tabs ? mapBy(windowData?.tabs, "id") : {}),
    [windowData],
  );
  const { removeRecordFromDatasource } = useDatasourceContext();

  const loadWindowData = useCallback(async () => {
    if (!windowId) return;

    try {
      setLoading(true);
      setError(undefined);

      Metadata.clearWindowCache(windowId);
      const newWindowData = await Metadata.forceWindowReload(windowId);

      setWindowData(newWindowData);
      setGroupedTabs(groupTabsByLevel(newWindowData));
    } catch (err) {
      logger.warn(err);

      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [windowId]);

  useEffect(() => {
    loadWindowData();
  }, [loadWindowData]);

  const removeRecord = useCallback(
    (tabId: string, recordId: string) => {
      removeRecordFromDatasource(tabId, recordId);
    },
    [removeRecordFromDatasource],
  );

  const emptyWindowDataName = useCallback(() => {
    setWindowData(
      (prevWindowData) => {
        return {
          ...prevWindowData,
          name: "",
          window$_identifier: "",
        } as Etendo.WindowMetadata;
      }
    );
  }, []);

  const value = useMemo<IMetadataContext>(
    () => ({
      windowId,
      loading,
      error,
      groupedTabs,
      window: windowData,
      tabs,
      refetch: loadWindowData,
      removeRecord,
      emptyWindowDataName,
    }),
    [error, groupedTabs, loadWindowData, loading, removeRecord, tabs, windowData, windowId, emptyWindowDataName],
  );

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}
