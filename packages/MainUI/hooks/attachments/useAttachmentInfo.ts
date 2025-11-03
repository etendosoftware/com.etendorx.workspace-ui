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

import { buildPayloadByInputName } from "@/utils";
import { logger } from "@/utils/logger";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { EntityData, FormInitializationResponse, Tab } from "@workspaceui/api-client/src/api/types";
import { useCallback, useState } from "react";

const ACTION = "org.openbravo.client.application.window.FormInitializationComponent";
const MODE = "SETSESSION";

export interface AttachmentInfo {
  attachmentExists: boolean;
  attachmentCount: number;
}

export const useAttachmentInfo = () => {
  const [attachmentCache, setAttachmentCache] = useState<Map<string, AttachmentInfo>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const fetchAttachmentInfo = useCallback(
    async (record: EntityData, tab: Tab): Promise<AttachmentInfo | null> => {
      if (!tab || !record?.id) return null;

      const recordId = String(record.id);
      const cacheKey = `${tab.id}_${recordId}`;

      // Return cached value if available
      if (attachmentCache.has(cacheKey)) {
        return attachmentCache.get(cacheKey) || null;
      }

      // Skip if already loading
      if (loading.has(cacheKey)) {
        return null;
      }

      const params = new URLSearchParams({
        _action: ACTION,
        MODE,
        TAB_ID: tab.id,
        ROW_ID: recordId,
        PARENT_ID: "null",
      });

      try {
        setLoading((prev) => new Set(prev).add(cacheKey));

        const payload = buildPayloadByInputName(record, tab.fields);
        const response = await Metadata.kernelClient.post(`?${params}`, payload);

        if (!response?.ok) {
          throw new Error(response.statusText);
        }

        const data = response.data as FormInitializationResponse;

        const attachmentInfo: AttachmentInfo = {
          attachmentExists: data.attachmentExists || false,
          attachmentCount: data.attachmentCount || 0,
        };

        setAttachmentCache((prev) => new Map(prev).set(cacheKey, attachmentInfo));
        setLoading((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cacheKey);
          return newSet;
        });

        return attachmentInfo;
      } catch (error) {
        logger.warn("Error fetching attachment info:", error);
        setLoading((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cacheKey);
          return newSet;
        });
        return null;
      }
    },
    [attachmentCache, loading]
  );

  const clearCache = useCallback(() => {
    setAttachmentCache(new Map());
  }, []);

  return {
    fetchAttachmentInfo,
    clearCache,
    attachmentCache,
  };
};
