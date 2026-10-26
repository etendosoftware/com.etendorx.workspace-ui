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
import { Button } from "@mui/material";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";

interface ErrorRecoveryScreenProps {
  error: Error & { digest?: string };
  /** Re-renders the failed subtree. Omit when the failure cannot be retried in place. */
  reset?: () => void;
}

/**
 * Recovery screen shown instead of a blank page when a component throws while rendering. Offers a
 * retry of the failed subtree and a full reload, and shows the error digest as a support reference.
 */
export function ErrorRecoveryScreen({ error, reset }: Readonly<ErrorRecoveryScreenProps>) {
  const { t } = useTranslation();

  useEffect(() => {
    logger.error("Unhandled render error", { message: error.message, digest: error.digest, stack: error.stack });
  }, [error]);

  return (
    <div className="w-full min-h-full flex items-center justify-center p-4" role="alert">
      <ErrorDisplay
        title={t("errors.boundary.title")}
        description={t("errors.boundary.description")}
        showRetry={Boolean(reset)}
        onRetry={reset}>
        {error.digest && (
          <p className="text-xs text-gray-500 mb-4">
            {t("errors.boundary.reference")}: {error.digest}
          </p>
        )}
        <Button variant="outlined" onClick={() => window.location.reload()}>
          {t("errors.boundary.reload")}
        </Button>
      </ErrorDisplay>
    </div>
  );
}
