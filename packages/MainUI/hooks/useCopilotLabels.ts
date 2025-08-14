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

import type { ILabels } from "@workspaceui/api-client/src/api/copilot";
import { useState, useCallback } from "react";
import { useCopilotClient } from "./useCopilotClient";

export const useCopilotLabels = () => {
  const [labels, setLabels] = useState<ILabels>({});
  const [areLabelsLoaded, setAreLabelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copilotClient = useCopilotClient();

  const getLabels = useCallback(
    async (retryCount = 0) => {
      setLoading(true);
      setError(null);

      try {
        const data = await copilotClient.getLabels();

        if (data) {
          setLabels(data);
          setAreLabelsLoaded(true);
        }
      } catch (err) {
        if (retryCount < 2) {
          setTimeout(() => getLabels(retryCount + 1), 1000);
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to load labels");
        console.error("Error loading Copilot labels:", err);
      } finally {
        setLoading(false);
      }
    },
    [copilotClient]
  );

  return {
    labels,
    areLabelsLoaded,
    loading,
    error,
    getLabels,
  };
};
