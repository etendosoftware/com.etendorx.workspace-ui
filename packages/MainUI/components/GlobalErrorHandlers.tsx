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

import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { classifyNetworkError } from "@/utils/errors/networkError";

export const OFFLINE_TOAST_ID = "connection-offline";
export const NETWORK_ERROR_TOAST_ID = "connection-error";
const BACK_ONLINE_DURATION_MS = 4000;

/**
 * Reports infrastructure failures with the existing toast system: the browser going offline or back
 * online, and network/timeout errors that nothing else handled (unhandled promise rejections).
 * Errors a caller already catches keep their own, more specific messages. Toasts use a fixed id so
 * repeated failures replace each other instead of piling up.
 */
export const useGlobalErrorHandlers = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleOffline = () => {
      toast.error(t("errors.connection.offlineTitle"), {
        id: OFFLINE_TOAST_ID,
        description: t("errors.connection.offlineDescription"),
        duration: Number.POSITIVE_INFINITY,
      });
    };

    const handleOnline = () => {
      // Same id: updates the persistent offline notice in place. The explicit duration replaces its
      // infinite one, so the confirmation disappears on its own.
      toast.success(t("errors.connection.backOnlineTitle"), {
        id: OFFLINE_TOAST_ID,
        description: "",
        duration: BACK_ONLINE_DURATION_MS,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const kind = classifyNetworkError(event.reason);
      if (!kind || navigator.onLine === false) return;

      if (kind === "timeout") {
        toast.error(t("errors.connection.timeoutTitle"), {
          id: NETWORK_ERROR_TOAST_ID,
          description: t("errors.connection.timeoutDescription"),
        });
        return;
      }

      toast.error(t("errors.networkError.title"), {
        id: NETWORK_ERROR_TOAST_ID,
        description: t("errors.networkError.description"),
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [t]);
};

/** Mounts {@link useGlobalErrorHandlers}; renders nothing. */
export const GlobalErrorHandlers = () => {
  useGlobalErrorHandlers();
  return null;
};
