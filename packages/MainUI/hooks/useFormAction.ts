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

import { buildFormPayload, buildQueryString } from "@/utils";
import { shouldRemoveIdFields } from "@/utils/form/entityConfig";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { EntityData, FormMode, Tab, WindowMetadata } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormHandleSubmit } from "react-hook-form";
import { useUserContext } from "./useUserContext";
import { normalizeDates } from "@/utils/form/normalizeDates";
import { DEFAULT_CSRF_TOKEN_ERROR, DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR } from "@/utils/session/constants";
import { useTranslation } from "./useTranslation";

export interface UseFormActionParams {
  windowMetadata?: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  onSuccess: (data: EntityData, showModal: boolean) => void;
  onError: (data: string) => void;
  initialState?: EntityData;
  submit: UseFormHandleSubmit<EntityData>;
}

export const useFormAction = ({
  windowMetadata,
  tab,
  mode,
  onSuccess,
  onError,
  initialState,
  submit,
}: UseFormActionParams) => {
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController>(new AbortController());
  const { user, logout, setLoginErrorText, setLoginErrorDescription } = useUserContext();
  const { t } = useTranslation();

  const userId = user?.id;

  const execute = useCallback(
    async (values: EntityData, showModal: boolean) => {
      try {
        setLoading(true);

        const queryStringParams = buildQueryString({ mode, windowMetadata, tab });

        const shouldRemoveId = shouldRemoveIdFields(tab.entityName, mode);

        let processedValues = { ...values };
        let processedInitialState = { ...initialState };

        if (shouldRemoveId) {
          const { id, id$_identifier: idIdentifier, ...valuesWithoutId } = processedValues;
          processedValues = valuesWithoutId as EntityData;

          if (processedInitialState) {
            const { id: initialId, id$_identifier: initialIdIdentifier, ...initialWithoutId } = processedInitialState;
            processedInitialState = initialWithoutId as EntityData;
          }
        }

        const body = buildFormPayload({
          values: processedValues,
          oldValues: processedInitialState,
          mode,
          csrfToken: userId,
        });

        const url = `${tab.entityName}?${queryStringParams}`;
        const options = {
          signal: controller.current.signal,
          method: "POST",
          body: normalizeDates(body) as Record<string, unknown>,
        };
        const { ok, data } = await Metadata.datasourceServletClient.request(url, options);

        if (ok && data?.response?.status === 0 && !controller.current.signal.aborted) {
          setLoading(false);
          onSuccess?.(data.response.data[0], showModal);
        } else {
          throw new Error(data.response.error?.message);
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
        if (errorMessage === DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR) {
          logout();
          setLoginErrorText(t("login.errors.noAccessTableNoView.title"));
          setLoginErrorDescription(t("login.errors.noAccessTableNoView.description"));
          return;
        }
        onError?.(String(err));
      }
    },
    [
      initialState,
      mode,
      onError,
      onSuccess,
      tab,
      userId,
      windowMetadata,
      logout,
      t,
      setLoginErrorText,
      setLoginErrorDescription,
    ]
  );

  const save = useCallback((showModal: boolean) => submit((values) => execute(values, showModal))(), [execute, submit]);

  useEffect(() => {
    const _controller = controller.current;

    return () => {
      _controller.abort();
      controller.current = new AbortController();
    };
  }, []);

  return { save, loading };
};
