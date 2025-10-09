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

"use client";

import { createContext, useContext, useCallback, useRef, type ReactNode, useMemo } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

interface DatasourceContextValue {
  registerDatasource: (tabId: string, removeRecordLocally: (recordId: string) => void) => void;
  unregisterDatasource: (tabId: string) => void;
  removeRecordFromDatasource: (tabId: string, recordId: string) => void;
  refetchDatasource: (tabId: string) => void;
  registerRefetchFunction: (tabId: string, refetchFunction: () => void) => void;
  registerRecordsGetter: (tabId: string, getRecords: () => EntityData[]) => void;
  getRecords: (tabId: string) => EntityData[];
  registerHasMoreRecordsGetter: (tabId: string, getHasMoreRecords: () => boolean) => void;
  getHasMoreRecords: (tabId: string) => boolean;
  registerFetchMore: (tabId: string, fetchMore: () => void) => void;
  fetchMoreRecords: (tabId: string) => void;
}

const DatasourceContext = createContext<DatasourceContextValue | undefined>(undefined);

export function DatasourceProvider({ children }: { children: ReactNode }) {
  const datasourcesRef = useRef<Record<string, (recordId: string) => void>>({});

  const refetchFunctionsRef = useRef<Record<string, () => void>>({});
  const recordsGettersRef = useRef<Record<string, () => EntityData[]>>({});
  const hasMoreRecordsGettersRef = useRef<Record<string, () => boolean>>({});
  const fetchMoreFunctionsRef = useRef<Record<string, () => void>>({});

  const registerRefetchFunction = useCallback((tabId: string, refetchFunction: () => void) => {
    refetchFunctionsRef.current[tabId] = refetchFunction;
  }, []);

  const refetchDatasource = useCallback((tabId: string) => {
    const refetchFunction = refetchFunctionsRef.current[tabId];
    if (refetchFunction) {
      refetchFunction();
    }
  }, []);

  const registerDatasource = useCallback((tabId: string, removeRecordLocally: (recordId: string) => void) => {
    datasourcesRef.current[tabId] = removeRecordLocally;
  }, []);

  const unregisterDatasource = useCallback((tabId: string) => {
    delete datasourcesRef.current[tabId];
  }, []);

  const removeRecordFromDatasource = useCallback((tabId: string, recordId: string) => {
    const removeFunction = datasourcesRef.current[tabId];
    if (removeFunction) {
      removeFunction(recordId);
    }
  }, []);

  const registerRecordsGetter = useCallback((tabId: string, getRecords: () => EntityData[]) => {
    recordsGettersRef.current[tabId] = getRecords;
  }, []);

  const getRecords = useCallback((tabId: string): EntityData[] => {
    const getRecordsFunction = recordsGettersRef.current[tabId];
    if (getRecordsFunction) {
      return getRecordsFunction();
    }
    return [];
  }, []);

  const registerHasMoreRecordsGetter = useCallback((tabId: string, getHasMoreRecords: () => boolean) => {
    hasMoreRecordsGettersRef.current[tabId] = getHasMoreRecords;
  }, []);

  const getHasMoreRecords = useCallback((tabId: string): boolean => {
    const getHasMoreRecordsFunction = hasMoreRecordsGettersRef.current[tabId];
    if (getHasMoreRecordsFunction) {
      return getHasMoreRecordsFunction();
    }
    return false;
  }, []);

  const registerFetchMore = useCallback((tabId: string, fetchMore: () => void) => {
    fetchMoreFunctionsRef.current[tabId] = fetchMore;
  }, []);

  const fetchMoreRecords = useCallback((tabId: string) => {
    const fetchMoreFunction = fetchMoreFunctionsRef.current[tabId];
    if (fetchMoreFunction) {
      fetchMoreFunction();
    }
  }, []);

  const value = useMemo(
    () => ({
      registerDatasource,
      unregisterDatasource,
      removeRecordFromDatasource,
      registerRefetchFunction,
      refetchDatasource,
      registerRecordsGetter,
      getRecords,
      registerHasMoreRecordsGetter,
      getHasMoreRecords,
      registerFetchMore,
      fetchMoreRecords,
    }),
    [
      registerDatasource,
      unregisterDatasource,
      removeRecordFromDatasource,
      registerRefetchFunction,
      refetchDatasource,
      registerRecordsGetter,
      getRecords,
      registerHasMoreRecordsGetter,
      getHasMoreRecords,
      registerFetchMore,
      fetchMoreRecords,
    ]
  );

  return <DatasourceContext.Provider value={value}>{children}</DatasourceContext.Provider>;
}

export function useDatasourceContext() {
  const context = useContext(DatasourceContext);
  if (context === undefined) {
    throw new Error("useDatasourceContext must be used within a DatasourceProvider");
  }
  return context;
}
