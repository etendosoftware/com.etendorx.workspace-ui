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

import { Button } from "@mui/material";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import type { AccessDeniedDisplayProps, AccessDeniedScreenProps } from "./types";

/**
 * Card telling the user that their role is not allowed to see the requested resource.
 * Reuses ErrorDisplay so it keeps the same illustration and layout as the other status screens.
 */
export function AccessDeniedDisplay({ description, children }: AccessDeniedDisplayProps) {
  const { t } = useTranslation();

  return (
    <ErrorDisplay
      title={t("errors.accessDenied.title")}
      description={description ?? t("errors.accessDenied.description")}
      data-testid="ErrorDisplay__b93399">
      {children}
    </ErrorDisplay>
  );
}

/**
 * Full-screen variant, rendered instead of the dashboard when every window requested through the
 * URL turned out to be inaccessible.
 *
 * The "home" action is a button rather than ErrorDisplay's `showHomeButton` link: "/" and "/window"
 * mount the same page, so navigating there would not dismiss this screen and would force an
 * avoidable RSC roundtrip.
 */
export function AccessDeniedScreen({ onGoHome }: AccessDeniedScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex items-center justify-center">
      <AccessDeniedDisplay data-testid="AccessDeniedDisplay__b93399">
        <Button variant="contained" onClick={onGoHome} data-testid="Button__b93399">
          {t("navigation.common.home")}
        </Button>
      </AccessDeniedDisplay>
    </div>
  );
}
