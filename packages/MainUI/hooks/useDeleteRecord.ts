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

import { useCallback, useRef, useState } from "react";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useUserContext } from "./useUserContext";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useTranslation } from "./useTranslation";

export interface UseDeleteRecordParams {
  tab: Tab;
  onSuccess?: (deletedCount: number) => void;
  onError?: (error: string) => void;
  showConfirmation?: boolean;
}

export const useDeleteRecord = ({ tab, onSuccess, onError }: UseDeleteRecordParams) => {
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController>(new AbortController());
  const { user } = useUserContext();
  const userId = user?.id;
  const { t } = useTranslation();

  const deleteRecord = useCallback(
    async (recordOrRecords: EntityData | EntityData[]) => {
      const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];

      if (records.length === 0) {
        onError?.(t("status.noRecordsError"));
        return false;
      }

      if (!tab || !tab.entityName) {
        onError?.(t("status.noEntityError"));
        return false;
      }

      try {
        setLoading(true);

        controller.current.abort();
        controller.current = new AbortController();

        const deletePromises = records.map((record) => {
          if (!record || !record.id) {
            throw new Error(t("status.noIdError"));
          }

          const queryParams = new URLSearchParams({
            windowId: String(tab.window),
            tabId: String(tab.id),
            moduleId: String(tab.module || "0"),
            _operationType: "remove",
            _noActiveFilter: "true",
            sendOriginalIDBack: "true",
            _extraProperties: "",
            Constants_FIELDSEPARATOR: "$",
            _className: "OBViewDataSource",
            Constants_IDENTIFIER: "_identifier",
            csrfToken: userId || "",
            id: String(record.id),
          });

          const url = `/${tab.entityName}?${queryParams}`;

          return Metadata.datasourceServletClient.request(url, {
            method: "DELETE",
            signal: controller.current.signal,
          });
        });

        const responses = await Promise.allSettled(deletePromises);

        const errors = responses.filter((response) => response.status === "rejected") as PromiseRejectedResult[];

        if (errors.length > 0) {
          const errorMessages = errors.map((err) =>
            err.reason instanceof Error ? err.reason.message : String(err.reason)
          );

          throw new Error(errorMessages.join("; "));
        }

        setLoading(false);

        if (onSuccess) {
          onSuccess(records.length);
        }

        return true;
      } catch (err) {
        setLoading(false);

        if (err instanceof Error && err.name === "AbortError") {
          return false;
        }

        if (onError) {
          onError(err instanceof Error ? err.message : String(err));
        }

        return false;
      }
    },
    [tab, onError, t, userId, onSuccess]
  );

  return { deleteRecord, loading };
};
