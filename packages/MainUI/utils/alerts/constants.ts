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

/** Classic kernel action handler that returns the pending alerts count: `{ cnt, result }`. */
export const ALERT_ACTION_HANDLER = "org.openbravo.client.application.AlertActionHandler";

/** Delay between two alert polls, same as classic `OB.AlertManager.delay`. */
export const ALERTS_POLL_DELAY_MS = 50000;

/** Classic navigation bar label, `"Alerts (%0)"`. */
export const ALERTS_LABEL_KEY = "UINAVBA_Alerts";

/** Placeholder shown in the label until the first response arrives (classic `"Alerts (-)"`). */
export const UNKNOWN_ALERT_COUNT = "-";

/** Classic view opened by the alerts indicator (`OB.Layout.ViewManager.openView`). */
export const ALERT_MANAGEMENT_VIEW_ID = "OBUIAPP_AlertManagement";

/** Property preference holding the classic navigation bar keyboard shortcuts. */
export const KEYBOARD_SHORTCUTS_PREFERENCE = "UINAVBA_KeyboardShortcuts";

/** Id of the alerts indicator entry inside {@link KEYBOARD_SHORTCUTS_PREFERENCE}. */
export const ALERT_SHORTCUT_ID = "NavBar_OBAlertIcon";

/** Classic default key for {@link ALERT_SHORTCUT_ID}, as reported by `KeyboardEvent.key`. */
export const DEFAULT_ALERT_SHORTCUT = "F8";

/**
 * Request flags that keep the poll from extending the classic session: `SessionExpirationFilter`
 * only skips the inactivity reset when BOTH are `"1"`.
 */
export const IGNORE_SESSION_TIMEOUT_PARAMS = {
  IsAjaxCall: "1",
  ignoreForSessionTimeout: "1",
} as const;

/**
 * Envelope of the message posted by the classic Alert Management popup (`alert-count-bridge.js` of
 * the metadata module) each time its alert count is refreshed: `{ type, action, payload: { cnt } }`.
 */
export const ALERT_COUNT_MESSAGE_TYPE = "etendoAlertCount";
export const ALERT_COUNT_MESSAGE_ACTION = "alertCountChanged";
