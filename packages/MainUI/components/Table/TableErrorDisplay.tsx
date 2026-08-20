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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import { AccessDeniedDisplay } from "@/components/AccessDeniedDisplay";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import { isAccessDeniedError } from "@/utils/accessDenied";

export interface TableErrorDisplayProps {
  /** Raw failure from useDatasource, which throws the response body rather than an Error. */
  error: unknown;
  onRetry: () => void;
}

/**
 * Picks the right status screen for a table failure: a permission message when the role is not
 * allowed to read the data, and the generic retryable error otherwise.
 */
export function TableErrorDisplay({ error, onRetry }: TableErrorDisplayProps) {
  const { t } = useTranslation();

  if (isAccessDeniedError(error)) {
    return (
      <AccessDeniedDisplay
        description={t("errors.accessDenied.tableDescription")}
        data-testid="AccessDeniedDisplay__b6f506"
      />
    );
  }

  return (
    <ErrorDisplay
      title={t("errors.tableError.title")}
      description={(error as Error | undefined)?.message}
      showRetry
      onRetry={onRetry}
      data-testid="ErrorDisplay__b6f506"
    />
  );
}
