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
import type { EntityData, Tab, WindowMetadata } from "@workspaceui/api-client/src/api/types";
import { useUserContext } from "./useUserContext";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useTranslation } from "./useTranslation";
import { buildDeleteQueryString } from "@/utils";
import { DEFAULT_CSRF_TOKEN_ERROR } from "@/utils/session/constants";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";

export interface UseDeleteRecordParams {
  windowMetadata?: WindowMetadata;
  tab: Tab;
  onSuccess?: (deletedCount: number) => void;
  onError?: (error: string) => void;
  showConfirmation?: boolean;
}

export const useDeleteRecord = ({ windowMetadata, tab, onSuccess, onError }: UseDeleteRecordParams) => {
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController>(new AbortController());
  const { user, logout, setLoginErrorText, setLoginErrorDescription } = useUserContext();
  const { triggerParentRefreshes } = useTabRefreshContext();
  const { t } = useTranslation();

  const userId = user?.id;

  const deleteRecord = useCallback(
    async (recordOrRecords: EntityData | EntityData[]): Promise<void> => {
      const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];

      if (records.length === 0) {
        onError?.(t("status.noRecordsError"));
        return;
      }

      if (!tab || !tab.entityName) {
        onError?.(t("status.noEntityError"));
        return;
      }

      if (!userId) {
        onError?.(t("errors.authentication.message"));
        return;
      }

      try {
        setLoading(true);

        controller.current.abort();
        controller.current = new AbortController();

        const deletePromises = records.map(async (record) => {
          if (!record || !record.id) {
            throw new Error(t("status.noIdError"));
          }

          const queryStringParams = buildDeleteQueryString({
            windowMetadata,
            tab,
            recordId: String(record.id),
          });
          const url = `${tab.entityName}?${queryStringParams}`;
          const options = { signal: controller.current.signal, method: "DELETE" };

          const { ok, data } = await Metadata.datasourceServletClient.request(url, options);

          if (ok && data?.response?.status === 0 && !controller.current.signal.aborted) {
            return;
          }

          throw new Error(data?.response?.error?.message || "Delete failed");
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
        onSuccess?.(records.length);
        // If save succeeded and this tab has parents, trigger parent refreshes
        if (tab?.tabLevel && tab.tabLevel > 0) {
          await triggerParentRefreshes(tab.tabLevel);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setLoading(false);
        if (errorMessage === DEFAULT_CSRF_TOKEN_ERROR) {
          logout();
          setLoginErrorText(t("login.errors.csrfToken.title"));
          setLoginErrorDescription(t("login.errors.csrfToken.description"));
          return;
        }
        onError?.(errorMessage);
      }
    },
    [tab, windowMetadata, onError, t, onSuccess, userId, logout, t, setLoginErrorText, setLoginErrorDescription]
  );

  return { deleteRecord, loading };
};
