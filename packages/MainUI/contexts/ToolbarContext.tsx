'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

type ToolbarActions = {
  save: () => void;
  refresh: () => void;
  new: () => void;
  back: () => void;
};

type ToolbarContextType = {
  onSave: () => void;
  onRefresh: () => void;
  onNew: () => void;
  onBack: () => void;
  registerActions: (actions: Partial<ToolbarActions>) => void;
};

const initialState: ToolbarActions = {
  save: () => {},
  refresh: () => {},
  new: () => {},
  back: () => {},
};

const ToolbarContext = createContext<ToolbarContextType>({} as ToolbarContextType);

export const useToolbarContext = () => useContext(ToolbarContext);

export const ToolbarProvider = ({ children }: React.PropsWithChildren) => {
  const [{ new: onNew, refresh: onRefresh, save: onSave, back: onBack }, setActions] =
    useState<ToolbarActions>(initialState);

  const registerActions = useCallback((newActions: Partial<ToolbarActions>) => {
    setActions(prev => ({ ...prev, ...newActions }));
  }, []);

  const value = useMemo(
    () => ({ onSave, onRefresh, onNew, onBack, registerActions }),
    [onNew, onRefresh, onSave, onBack, registerActions],
  );

  return <ToolbarContext.Provider value={value}>{children}</ToolbarContext.Provider>;
};
