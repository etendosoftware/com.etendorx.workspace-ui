/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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
 * Canonical string values returned by the metadata backend for the
 * `Menu.type` field. Centralised here to avoid magic strings sprinkled
 * across the menu dispatch layer.
 */
export const MENU_ITEM_TYPES = {
  PROCESS_DEFINITION: "ProcessDefinition",
  PROCESS: "Process",
  FORM: "Form",
  WINDOW: "Window",
  PROCESS_MANUAL: "ProcessManual",
  REPORT: "Report",
} as const;

export type MenuItemType = (typeof MENU_ITEM_TYPES)[keyof typeof MENU_ITEM_TYPES];
