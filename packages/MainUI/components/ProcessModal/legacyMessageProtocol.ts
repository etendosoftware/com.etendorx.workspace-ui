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

/**
 * Centralizes the postMessage envelope type and action names exchanged between the
 * legacy iframe and the parent window.
 *
 * Mirrored on the backend by
 * `erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/http/LegacyMessageProtocol.java`.
 * Both files MUST stay in sync — any new action requires updating both.
 */
export const LEGACY_MESSAGE_TYPE = "fromForm";

export const LEGACY_ACTIONS = {
  CLOSE_MODAL: "closeModal",
  PROCESS_ORDER: "processOrder",
  SHOW_PROCESS_MESSAGE: "showProcessMessage",
  IFRAME_UNLOADED: "iframeUnloaded",
  REQUEST_FAILED: "requestFailed",
} as const;

export type LegacyAction = (typeof LEGACY_ACTIONS)[keyof typeof LEGACY_ACTIONS];
