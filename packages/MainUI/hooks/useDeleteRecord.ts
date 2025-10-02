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
import { buildSingleDeleteQueryString } from "@/utils";
import { DEFAULT_CSRF_TOKEN_ERROR } from "@/utils/session/constants";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";

export interface UseDeleteRecordParams {
  windowMetadata?: WindowMetadata;
  tab: Tab;
  onSuccess?: (deletedCount: number) => void;
  onError?: ({ errorMessage, needToRefresh }: { errorMessage: string; needToRefresh?: boolean }) => void;
  showConfirmation?: boolean;
}

interface DeleteRecordResponse {
  success: boolean;
  errorMessage?: string;
}

const DEFAULT_MULTI_DELETE_RECORD_URL_ACTION = "org.openbravo.client.application.MultipleDeleteActionHandler";

export const useDeleteRecord = ({ windowMetadata, tab, onSuccess, onError }: UseDeleteRecordParams) => {
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController>(new AbortController());
  const { user, logout, setLoginErrorText, setLoginErrorDescription } = useUserContext();
  const { triggerParentRefreshes } = useTabRefreshContext();
  const { t } = useTranslation();

  const userId = user?.id;

  const handleSingleDeleteRecord = useCallback(
    async (record: EntityData): Promise<DeleteRecordResponse> => {
      if (!record || !record.id) {
        return { success: false, errorMessage: t("status.noIdError") };
      }
      const recordId = String(record.id);

      const queryStringParams = buildSingleDeleteQueryString({
        windowMetadata,
        tab,
        recordId: recordId,
      });
      const url = `${tab.entityName}?${queryStringParams}`;
      const options = { signal: controller.current.signal, method: "DELETE" };

      const { ok, data } = await Metadata.datasourceServletClient.request(url, options);
      const errorMessage = data?.response?.error?.message;

      if (ok && data?.response?.status === 0 && !errorMessage && !controller.current.signal.aborted) {
        return { success: true };
      }

      return { success: false, errorMessage };
    },
    [windowMetadata, tab]
  );

  const handleMultiDeleteRecord = useCallback(
    async (records: EntityData[]): Promise<DeleteRecordResponse> => {
      const params = new URLSearchParams({
        _action: DEFAULT_MULTI_DELETE_RECORD_URL_ACTION,
      });
      const options = { signal: controller.current.signal, method: "POST" };
      const recordIds = records.map((record) => record.id);
      const entityName = tab.entityName;
      const payload = { entity: entityName, ids: recordIds };

      const { ok, data } = await Metadata.kernelClient.post(`?${params}`, payload, options);

      const errorMessage = data?.response?.error?.message;

      if (ok && !errorMessage && !controller.current.signal.aborted) {
        return { success: true };
      }

      return { success: false, errorMessage };
    },
    [tab]
  );

  const deleteRecord = useCallback(
    async (recordOrRecords: EntityData | EntityData[]): Promise<void> => {
      const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];

      if (records.length === 0) {
        onError?.({ errorMessage: t("status.noRecordsError") });
        return;
      }

      if (!tab || !tab.entityName) {
        onError?.({ errorMessage: t("status.noEntityError") });
        return;
      }

      if (!userId) {
        onError?.({ errorMessage: t("errors.authentication.message") });
        return;
      }

      try {
        setLoading(true);

        controller.current.abort();
        controller.current = new AbortController();

        const isSingleRecord = records.length === 1;
        const response = isSingleRecord
          ? await handleSingleDeleteRecord(records[0])
          : await handleMultiDeleteRecord(records);

        const { success: responseSuccess, errorMessage: responseErrorMessage } = response;

        if (!responseSuccess && responseErrorMessage) {
          onError?.({ errorMessage: responseErrorMessage });
          throw new Error(responseErrorMessage);
        }

        onSuccess?.(records.length);
        // If save succeeded and this tab has parents, trigger parent refreshes
        if (tab?.tabLevel && tab.tabLevel > 0) {
          await triggerParentRefreshes(tab.tabLevel);
        }
        // TODO: if on form view redirect to the grid view of the same tab
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage === DEFAULT_CSRF_TOKEN_ERROR) {
          logout();
          setLoginErrorText(t("login.errors.csrfToken.title"));
          setLoginErrorDescription(t("login.errors.csrfToken.description"));
          return;
        }
        onError?.({ errorMessage });
      } finally {
        setLoading(false);
      }
    },
    [tab, windowMetadata, onError, t, onSuccess, userId, logout, t, setLoginErrorText, setLoginErrorDescription]
  );

  return { deleteRecord, loading };
};
