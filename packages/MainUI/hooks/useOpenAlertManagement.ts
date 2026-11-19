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

import { useCallback } from "react";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { useUserStore } from "@/stores/userStore";
import { ALERT_MANAGEMENT_VIEW_ID } from "@/utils/alerts/constants";
import { openEtendoViewPopup } from "@/utils/menu/openEtendoView";

/**
 * Opens Classic's Alert Management view, where alerts can be acknowledged, suppressed or solved. Shared by the
 * alerts indicator of the header and the notifications widget.
 *
 * @returns a callback that opens the view
 */
export function useOpenAlertManagement(): () => void {
  const token = useUserStore((s) => s.token);
  const { config } = useRuntimeConfig();

  return useCallback(() => {
    openEtendoViewPopup({ baseUrl: config?.etendoClassicHost || "", viewId: ALERT_MANAGEMENT_VIEW_ID, token });
  }, [config?.etendoClassicHost, token]);
}
