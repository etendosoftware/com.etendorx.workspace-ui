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

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface RuntimeConfig {
  etendoClassicHost: string;
}

interface RuntimeConfigContextType {
  config: RuntimeConfig | null;
  loading: boolean;
}

const RuntimeConfigContext = createContext<RuntimeConfigContextType | undefined>(undefined);

interface RuntimeConfigProviderProps {
  children: ReactNode;
}

/**
 * Provider that loads runtime configuration once at app initialization
 * This prevents redundant API calls on every navigation
 */
export function RuntimeConfigProvider({ children }: RuntimeConfigProviderProps) {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch config once on mount
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("[RuntimeConfigProvider] Failed to fetch config:", error);
        setLoading(false);
      });
  }, []); // Empty dependency array ensures this runs only once

  return <RuntimeConfigContext.Provider value={{ config, loading }}>{children}</RuntimeConfigContext.Provider>;
}

/**
 * Hook to access runtime configuration
 * Configuration is loaded once at app initialization and shared across all components
 */
export function useRuntimeConfig(): RuntimeConfigContextType {
  const context = useContext(RuntimeConfigContext);
  if (context === undefined) {
    throw new Error("useRuntimeConfig must be used within a RuntimeConfigProvider");
  }
  return context;
}
