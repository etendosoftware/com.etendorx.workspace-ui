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

import { useCallback, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import type { EntityValue } from "@workspaceui/api-client/src/api/types";
import { buildPayloadByInputName } from "@/utils";

export interface ProcessConfigResponse {
  processId: string;
  defaults?: Record<string, { value: string; identifier: string }>;
  filterExpressions?: Record<string, Record<string, string>>;
  refreshParent?: boolean;
}

interface UseProcessConfigProps {
  processId: string;
  windowId: string;
  tabId: string;
  javaClassName?: string;
  gridSelection?: unknown[];
}

/**
 * Hook to obtain the configuration for process execution
 * @param processId - ID of the process
 * @param windowId - ID of the window
 * @param tabId - ID of the tab
 * @param javaClassName - Java class name for the process action (optional, defaults to DefaultsProcessActionHandler)
 * @returns Object with functions to handle the configuration of the process
 */
export const useProcessConfig = ({ processId, windowId, tabId, javaClassName }: UseProcessConfigProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<ProcessConfigResponse | null>(null);

  const fetchConfig = useCallback(
    async (payload: Record<string, EntityValue> = {}) => {
      if (!processId || !windowId || !tabId) {
        return null;
      }

      const params = new URLSearchParams({
        processId,
        windowId,
        _action: javaClassName || "org.openbravo.client.application.process.DefaultsProcessActionHandler",
      });
      const buildPayload = buildPayloadByInputName(payload);

      const requestPayload = {
        ...buildPayload,
        _params: {
          grid: {},
        },
      };

      try {
        setLoading(true);
        setError(null);

        const { data } = await Metadata.kernelClient.post(`?${params}`, requestPayload);

        const processedConfig: ProcessConfigResponse = {
          processId,
          defaults: data?.defaults || {},
          filterExpressions: data?.filterExpressions || {},
          refreshParent: !!data?.refreshParent,
        };

        setConfig(processedConfig);
        return processedConfig;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error fetching process config";

        logger.error(`Error fetching process config for process ${processId}:`, err);
        setError(new Error(errorMessage));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [processId, windowId, tabId, javaClassName]
  );

  return {
    fetchConfig,
    loading,
    error,
    config,
  };
};
