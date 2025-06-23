"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

type ToolbarActions = {
  save: () => void;
  refresh: () => void;
  new: () => void;
  back: () => void;
  filter: () => void;
};

type ToolbarContextType = {
  onSave: () => void;
  onRefresh: () => void;
  onNew: () => void;
  onBack: () => void;
  onFilter: () => void;
  registerActions: (actions: Partial<ToolbarActions>) => void;
};

const initialState: ToolbarActions = {
  save: () => {},
  refresh: () => {},
  new: () => {},
  back: () => {},
  filter: () => {},
};

const ToolbarContext = createContext<ToolbarContextType>({} as ToolbarContextType);

export const useToolbarContext = () => useContext(ToolbarContext);

export const ToolbarProvider = ({ children }: React.PropsWithChildren) => {
  const [{ new: onNew, refresh: onRefresh, save: onSave, back: onBack, filter: onFilter }, setActions] =
    useState<ToolbarActions>(initialState);

  const registerActions = useCallback((newActions: Partial<ToolbarActions>) => {
    setActions((prev) => ({ ...prev, ...newActions }));
  }, []);

  const value = useMemo(
    () => ({ onSave, onRefresh, onNew, onBack, onFilter, registerActions }),
    [onNew, onRefresh, onSave, onBack, onFilter, registerActions]
  );

  return <ToolbarContext.Provider value={value}>{children}</ToolbarContext.Provider>;
};
