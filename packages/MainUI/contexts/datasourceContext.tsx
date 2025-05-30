"use client";

import { createContext, useContext, useCallback, useRef, type ReactNode, useMemo } from "react";

interface DatasourceContextValue {
  registerDatasource: (tabId: string, removeRecordLocally: (recordId: string) => void) => void;
  unregisterDatasource: (tabId: string) => void;
  removeRecordFromDatasource: (tabId: string, recordId: string) => void;
  refetchDatasource: (tabId: string) => void;
  registerRefetchFunction: (tabId: string, refetchFunction: () => void) => void;
}

const DatasourceContext = createContext<DatasourceContextValue | undefined>(undefined);

export function DatasourceProvider({ children }: { children: ReactNode }) {
  const datasourcesRef = useRef<Record<string, (recordId: string) => void>>({});

  const refetchFunctionsRef = useRef<Record<string, () => void>>({});

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

  const value = useMemo(
    () => ({
      registerDatasource,
      unregisterDatasource,
      removeRecordFromDatasource,
      registerRefetchFunction,
      refetchDatasource,
    }),
    [registerDatasource, unregisterDatasource, removeRecordFromDatasource, registerRefetchFunction, refetchDatasource],
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
