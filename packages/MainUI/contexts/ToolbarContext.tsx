"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

type ToolbarActions = {
  save: (showModal: boolean) => Promise<void>;
  refresh: () => void;
  new: () => void;
  back: () => void;
  filter: () => void;
  columnFilters: (buttonRef?: HTMLElement | null) => void;
};

type ToolbarContextType = {
  onSave: (showModal: boolean) => Promise<void>;
  onRefresh: () => void;
  onNew: () => void;
  onBack: () => void;
  onFilter: () => void;
  onColumnFilters: (buttonRef?: HTMLElement | null) => void;
  registerActions: (actions: Partial<ToolbarActions>) => void;
};

const initialState: ToolbarActions = {
  save: async () => {},
  refresh: () => {},
  new: () => {},
  back: () => {},
  filter: () => {},
  columnFilters: () => {},
};

const ToolbarContext = createContext<ToolbarContextType>({} as ToolbarContextType);

export const useToolbarContext = () => useContext(ToolbarContext);

export const ToolbarProvider = ({ children }: React.PropsWithChildren) => {
  const [
    { new: onNew, refresh: onRefresh, save: onSave, back: onBack, filter: onFilter, columnFilters: onColumnFilters },
    setActions,
  ] = useState<ToolbarActions>(initialState);

  const registerActions = useCallback((newActions: Partial<ToolbarActions>) => {
    setActions((prev) => ({ ...prev, ...newActions }));
  }, []);

  const value = useMemo(
    () => ({ onSave, onRefresh, onNew, onBack, onFilter, onColumnFilters, registerActions }),
    [onNew, onRefresh, onSave, onBack, onFilter, onColumnFilters, registerActions]
  );

  return <ToolbarContext.Provider value={value}>{children}</ToolbarContext.Provider>;
};
