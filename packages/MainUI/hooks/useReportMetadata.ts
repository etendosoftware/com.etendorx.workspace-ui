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

import { logger } from "@/utils/logger";
import type { ReportMetadata } from "@workspaceui/api-client/src/hooks/types";
import { useCallback, useEffect, useState } from "react";

export interface ReportMetadataHook {
  metadata: ReportMetadata | null;
  loading: boolean;
  error: string | null;
}

const REPORT_ID_TO_FILE_MAP: Record<string, string> = {
  "800261": "sales-order",
  "800069": "sales-order-invoice",
};

export const useReportMetadata = (reportId?: string): ReportMetadataHook => {
  const [metadata, setMetadata] = useState<ReportMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(
    async (controller: AbortController) => {
      if (!reportId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fileName = REPORT_ID_TO_FILE_MAP[reportId];
        if (!fileName) {
          throw new Error(`No report file found for ID: ${reportId}`);
        }

        const reportModule = await import(`../reports/${fileName}`);

        if (!controller.signal.aborted) {
          const reportMeta = Object.values(reportModule)[0] as ReportMetadata;
          if (reportMeta.id !== reportId) {
            throw new Error(`Report ID mismatch: expected ${reportId}, got ${reportMeta.id}`);
          }
          setMetadata(reportMeta);
        }
      } catch (err) {
        logger.warn(err);

        if (!controller.signal.aborted) {
          setError(`Failed to load report metadata: ${(err as Error).message}`);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [reportId]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchMetadata(controller);
    return () => {
      controller.abort();
    };
  }, [fetchMetadata]);

  return { metadata, loading, error };
};
