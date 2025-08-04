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

import { createContext, useContext, useState, useCallback, useMemo } from "react";

type ToolbarActions = {
  save: () => Promise<void>;
  refresh: () => void;
  new: () => void;
  back: () => void;
  filter: () => void;
  columnFilters: (buttonRef?: HTMLElement | null) => void;
};

type ToolbarContextType = {
  onSave: () => Promise<void>;
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
