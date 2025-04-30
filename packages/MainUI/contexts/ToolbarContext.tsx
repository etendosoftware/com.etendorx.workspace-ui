'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

type ToolbarActions = {
  save: () => void;
  refresh: () => void;
  new: () => void;
};

type ToolbarContextType = {
  onSave: () => void;
  onRefresh: () => void;
  onNew: () => void;
  registerActions: (actions: Partial<ToolbarActions>) => void;
};

const initialState: ToolbarActions = {
  save: () => {},
  refresh: () => {},
  new: () => {},
};

const ToolbarContext = createContext<ToolbarContextType>({} as ToolbarContextType);

export const useToolbarContext = () => useContext(ToolbarContext);

export const ToolbarProvider = ({ children }: React.PropsWithChildren) => {
  const [{ new: onNew, refresh: onRefresh, save: onSave }, setActions] = useState<ToolbarActions>(initialState);

  const registerActions = useCallback((newActions: Partial<ToolbarActions>) => {
    setActions(prev => ({ ...prev, ...newActions }));
  }, []);

  const value = useMemo(
    () => ({ onSave, onRefresh, onNew, registerActions }),
    [onNew, onRefresh, onSave, registerActions],
  );

  return <ToolbarContext.Provider value={value}>{children}</ToolbarContext.Provider>;
};
