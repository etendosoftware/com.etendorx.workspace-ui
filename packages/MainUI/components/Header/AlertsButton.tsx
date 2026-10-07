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

import { useCallback, useMemo } from "react";
import BellIcon from "@workspaceui/componentlibrary/src/assets/icons/bell.svg";
import BellAlertIcon from "@workspaceui/componentlibrary/src/assets/icons/bell-alert.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import { useLanguage } from "@/contexts/language";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { useAlertCount } from "@/hooks/useAlertCount";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUserStore } from "@/stores/userStore";
import { ALERT_MANAGEMENT_VIEW_ID, ALERTS_LABEL_KEY, UNKNOWN_ALERT_COUNT } from "@/utils/alerts/constants";
import { resolveAlertShortcut } from "@/utils/alerts/resolveAlertShortcut";
import { openEtendoViewPopup } from "@/utils/menu/openEtendoView";
import { createI18N } from "@/utils/ob/i18n";

/**
 * Formats the count shown in the `"Alerts (%0)"` label: `"-"` until the first response arrives.
 *
 * @param count - Pending alerts count, or `null` when still unknown
 */
export function formatAlertCount(count: number | null): string {
  if (count === null) {
    return UNKNOWN_ALERT_COUNT;
  }
  return String(count);
}

/**
 * Whether the bell shows the notification dot: only when the count is known and greater than 0.
 *
 * @param count - Pending alerts count, or `null` when still unknown
 */
export function hasPendingAlerts(count: number | null): boolean {
  return count !== null && count > 0;
}

/**
 * Navigation bar alerts indicator (classic `OBAlertIcon`): polls the pending alerts count, shows a
 * bell with a notification dot when there are pending alerts and the translated
 * `"Alerts (N)"` label as tooltip, and opens the classic Alert Management view on click or with
 * its keyboard shortcut (`NavBar_OBAlertIcon`, F8 by default).
 */
const AlertsButton: React.FC = () => {
  const token = useUserStore((s) => s.token);
  const roleId = useUserStore((s) => s.currentRole?.id);
  const passwordExpired = useUserStore((s) => s.passwordExpired);
  const { getLabel } = useLanguage();
  const { config } = useRuntimeConfig();

  const enabled = Boolean(token && roleId && !passwordExpired);
  const count = useAlertCount(enabled, roleId);
  const label = createI18N({ getLabel }).getLabel(ALERTS_LABEL_KEY, [formatAlertCount(count)]);
  const Icon = hasPendingAlerts(count) ? BellAlertIcon : BellIcon;

  const openAlertManagement = useCallback(() => {
    openEtendoViewPopup({ baseUrl: config?.etendoClassicHost || "", viewId: ALERT_MANAGEMENT_VIEW_ID, token });
  }, [config?.etendoClassicHost, token]);

  const shortcuts = useMemo(
    () => ({ [resolveAlertShortcut()]: { handler: openAlertManagement, allowInInputs: true } }),
    [openAlertManagement]
  );
  useKeyboardShortcuts(shortcuts, enabled);

  return (
    <IconButton onClick={openAlertManagement} tooltip={label} ariaLabel={label} className="w-10 h-10">
      <Icon />
    </IconButton>
  );
};

export default AlertsButton;
