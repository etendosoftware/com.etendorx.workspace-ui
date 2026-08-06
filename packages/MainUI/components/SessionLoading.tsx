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

import Loading from "@/components/loading";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Full-screen loader shown while the user session is being loaded
 * (between a successful login/reload and the session being ready).
 * It prevents the dashboard from flashing empty content before its own
 * loading state kicks in.
 */
export default function SessionLoading() {
  const { t } = useTranslation();

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center gap-4"
      data-testid="SessionLoading__container">
      <Loading className="h-auto" customIconProps={{ size: 48 }} data-testid="SessionLoading__spinner" />
      <p className="font-inter text-sm text-(--color-transparent-neutral-70)">{t("login.loadingSession")}</p>
    </div>
  );
}
