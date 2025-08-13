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

import { createContext, useCallback, useEffect, useReducer, useRef } from "react";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import { HEALTH_CHECK_MAX_ATTEMPTS, HEALTH_CHECK_RETRY_DELAY_MS } from "@/constants/config";
import { initialState, stateReducer } from "./state";
import { performHealthCheck } from "../../utils/health-check";
import Loading from "@/components/loading";

export const ApiContext = createContext<string | null>(null);

export default function ApiProvider({ children, url }: React.PropsWithChildren<{ url: string }>) {
  const [state, dispatch] = useReducer(stateReducer, initialState);
  const controllerRef = useRef<AbortController>(new AbortController());
  const { t } = useTranslation();

  const healthCheck = useCallback(() => {
    const signal = controllerRef.current.signal;

    if (url && !signal.aborted) {
      dispatch({ type: "RESET" });
      performHealthCheck(
        url,
        signal,
        HEALTH_CHECK_MAX_ATTEMPTS,
        HEALTH_CHECK_RETRY_DELAY_MS,
        () => {
          if (signal.aborted) return;
          dispatch({ type: "SET_CONNECTED" });
        },
        () => {
          if (signal.aborted) return;
          dispatch({ type: "SET_ERROR" });
        }
      );
    }
  }, [url]);

  useEffect(() => {
    const controller = controllerRef.current;
    healthCheck();

    return () => {
      controller.abort();
      controllerRef.current = new AbortController();
    };
  }, [healthCheck]);

  if (state.connected) {
    return <ApiContext.Provider value={url}>{children}</ApiContext.Provider>;
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <ErrorDisplay
          title={t("errors.networkError.title")}
          description={t("errors.networkError.description")}
          showRetry={true}
          onRetry={healthCheck}
        />
      </div>
    );
  }

  return <Loading />;
}
