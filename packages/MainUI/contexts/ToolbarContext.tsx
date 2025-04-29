'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type ToolbarActions = {
  save?: () => void;
  refresh?: () => void;
  new?: () => void;
};

type ToolbarContextType = {
  onSave: () => void;
  onRefresh: () => void;
  onNew: () => void;
  registerActions: (actions: ToolbarActions) => void;
};

const ToolbarContext = createContext<ToolbarContextType>({
  onSave: () => {},
  onRefresh: () => {},
  onNew: () => {},
  registerActions: () => {},
});

export const useToolbarContext = () => useContext(ToolbarContext);

export const ToolbarProvider = ({ children }: React.PropsWithChildren) => {
  const [actions, setActions] = useState<ToolbarActions>({});

  const registerActions = useCallback((newActions: ToolbarActions) => {
    setActions(prev => ({ ...prev, ...newActions }));
  }, []);

  const onSave = useCallback(() => {
    if (actions.save) {
      actions.save();
    }
  }, [actions]);

  const onRefresh = useCallback(() => {
    if (actions.refresh) {
      actions.refresh();
    }
  }, [actions]);

  const onNew = useCallback(() => {
    if (actions.new) {
      actions.new();
    }
  }, [actions]);

  return (
    <ToolbarContext.Provider value={{ onSave, onRefresh, onNew, registerActions }}>{children}</ToolbarContext.Provider>
  );
};
