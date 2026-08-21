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
import { useUserStore } from "@/stores/userStore";
import { useUserContext } from "@/hooks/useUserContext";
import { normalizeDates } from "@/utils/form/normalizeDates";
import { DEFAULT_CSRF_TOKEN_ERROR, DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR } from "@/utils/session/constants";
import { isStaleObjectError } from "@/components/Table/utils/saveOperations";
import { useTranslation } from "./useTranslation";
import type { SaveOptions } from "@/contexts/ToolbarContext";
import type { TranslateFunction } from "@/hooks/types";

/**
 * Extracts a human-readable error message from the datasource servlet response.
 * The backend may return errors in two shapes:
 *   1. { error: { message: "..." } }           — process / callout errors
 *   2. { errors: { fieldName: "..." , ... } }   — field-level validation errors
 */
export function extractServerErrorMessage(response: Record<string, unknown> | undefined): string {
  if (!response) return "Unknown server error";

  const singleError = response.error as { message?: string } | undefined;
  if (singleError?.message) return singleError.message;

  const fieldErrors = response.errors as Record<string, string> | undefined;
  if (fieldErrors && typeof fieldErrors === "object") {
    const messages = Object.values(fieldErrors).filter(Boolean);
    if (messages.length > 0) return messages.join("; ");
  }

  return "Unknown server error";
}

export interface OnErrorOptions {
  onReload?: () => void | Promise<void>;
}

/**
 * Builds the showErrorModal options for an onError callback given an optional reload action,
 * so callers show the reload-aware conflict notice without duplicating the label lookup.
 */
export function buildReloadModalOptions(
  onReload: (() => void | Promise<void>) | undefined,
  t: TranslateFunction
): { onReload: () => void | Promise<void>; reloadLabel: string } | undefined {
  return onReload ? { onReload, reloadLabel: t("status.staleObjectReloadAction") } : undefined;
}

/**
 * Strips {@code id}/{@code id$_identifier} from {@code values} (and {@code initialState}, if
 * present) when {@code shouldRemove} is true -- new records must not send an id back to the
 * datasource servlet. Mirrors the datasource servlet's own field set exactly, including always
 * spreading {@code initialState} into a plain object even when it's undefined.
 */
function stripIdFieldsIfNeeded(
  values: EntityData,
  initialState: EntityData | undefined,
  shouldRemove: boolean
): { processedValues: EntityData; processedInitialState: EntityData } {
  let processedValues = { ...values };
  let processedInitialState = { ...initialState };

  if (shouldRemove) {
    const { id, id$_identifier: idIdentifier, ...valuesWithoutId } = processedValues;
    processedValues = valuesWithoutId as EntityData;

    if (processedInitialState) {
      const { id: initialId, id$_identifier: initialIdIdentifier, ...initialWithoutId } = processedInitialState;
      processedInitialState = initialWithoutId as EntityData;
    }
  }

  return { processedValues, processedInitialState };
}

/**
 * Resolves the error message from a failed save response.
 *
 * com.etendoerp.metadata's ForwarderServlet returns a distinct, flat 409 body for version
 * conflicts ({@code {error, code: "STALE_OBJECT", cid}}), instead of the generic nested shape
 * used for every other save error.
 */
function resolveSaveErrorMessage(status: number, data: Record<string, unknown> | undefined): string {
  const isStructuredConflict = status === 409 && data?.code === "STALE_OBJECT";
  return isStructuredConflict
    ? (data?.error as string)
    : extractServerErrorMessage(data?.response as Record<string, unknown> | undefined);
}

interface SaveErrorHandlers {
  logout: () => void;
  setLoginErrorText: (text: string) => void;
  setLoginErrorDescription: (description: string) => void;
  onError?: (data: string, options?: OnErrorOptions) => void;
  onStaleObjectReload?: () => void | Promise<void>;
  t: TranslateFunction;
}

/**
 * Routes a failed save to the right handler: a CSRF/session error logs the user out, a
 * stale-object conflict surfaces the specific reload-aware notice, and everything else falls
 * back to the generic {@code onError}.
 */
function handleSaveError(err: unknown, handlers: SaveErrorHandlers): void {
  const errorMessage = err instanceof Error ? err.message : String(err);

  if (errorMessage === DEFAULT_CSRF_TOKEN_ERROR) {
    handlers.logout();
    handlers.setLoginErrorText(handlers.t("login.errors.csrfToken.title"));
    handlers.setLoginErrorDescription(handlers.t("login.errors.csrfToken.description"));
    return;
  }
  if (errorMessage === DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR) {
    handlers.logout();
    handlers.setLoginErrorText(handlers.t("login.errors.noAccessTableNoView.title"));
    handlers.setLoginErrorDescription(handlers.t("login.errors.noAccessTableNoView.description"));
    return;
  }
  if (isStaleObjectError(errorMessage)) {
    handlers.onError?.(
      handlers.t("status.staleObjectError"),
      handlers.onStaleObjectReload ? { onReload: handlers.onStaleObjectReload } : undefined
    );
    return;
  }
  handlers.onError?.(String(err));
}

export interface UseFormActionParams {
  windowMetadata?: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  onSuccess: (data: EntityData, options: SaveOptions) => void | Promise<void>;
  onError: (data: string, options?: OnErrorOptions) => void;
  initialState?: EntityData;
  submit: UseFormHandleSubmit<EntityData>;
  /** Called to refresh the record when the user chooses to reload after a stale-object conflict. */
  onStaleObjectReload?: () => void | Promise<void>;
}

export const useFormAction = ({
  windowMetadata,
  tab,
  mode,
  onSuccess,
  onError,
  initialState,
  submit,
  onStaleObjectReload,
}: UseFormActionParams) => {
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController>(new AbortController());
  const lastSaveSucceeded = useRef(false);
  const user = useUserStore((s) => s.user);
  const setLoginErrorText = useUserStore((s) => s.setLoginErrorText);
  const setLoginErrorDescription = useUserStore((s) => s.setLoginErrorDescription);
  const { logout } = useUserContext();
  const { t } = useTranslation();

  const userId = user?.id;

  const execute = useCallback(
    async (values: EntityData, saveOptions: SaveOptions) => {
      try {
        setLoading(true);

        const queryStringParams = buildQueryString({ mode, windowMetadata, tab });
        const shouldRemoveId = shouldRemoveIdFields(tab.entityName, mode);
        const { processedValues, processedInitialState } = stripIdFieldsIfNeeded(values, initialState, shouldRemoveId);

        const body = buildFormPayload({
          values: processedValues,
          oldValues: processedInitialState,
          mode,
          csrfToken: userId,
          tab,
        });

        const url = `${tab.entityName}?${queryStringParams}`;
        const requestOptions = {
          signal: controller.current.signal,
          method: "POST",
          body: normalizeDates(body) as Record<string, unknown>,
        };
        const { ok, status, data } = await Metadata.datasourceServletClient.request(url, requestOptions);

        if (ok && data?.response?.status === 0 && !controller.current.signal.aborted) {
          lastSaveSucceeded.current = true;
          setLoading(false);
          onSuccess?.(data.response.data[0], saveOptions);
        } else {
          throw new Error(resolveSaveErrorMessage(status, data));
        }
      } catch (err) {
        setLoading(false);
        handleSaveError(err, {
          logout,
          setLoginErrorText,
          setLoginErrorDescription,
          onError,
          onStaleObjectReload,
          t,
        });
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
      onStaleObjectReload,
    ]
  );

  const save = useCallback(
    async (options: SaveOptions): Promise<boolean> => {
      lastSaveSucceeded.current = false;
      await submit((values) => execute(values, options))();
      return lastSaveSucceeded.current;
    },
    [execute, submit]
  );

  useEffect(() => {
    const _controller = controller.current;

    return () => {
      _controller.abort();
      controller.current = new AbortController();
    };
  }, []);

  return { save, loading };
};
