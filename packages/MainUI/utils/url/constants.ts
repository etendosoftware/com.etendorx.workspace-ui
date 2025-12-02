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

export const WINDOW_IDENTIFIER_PREFIX = "wi_";
export const URL_PREFIXS = {
  WINDOW_IDENTIFIER: "wi",
  TAB_IDENTIFIER: "ti",
  RECORD_IDENTIFIER: "ri",
};

export const NEW_RECORD_ID = "new";

export const FORM_MODES = {
  NEW: "new",
  EDIT: "edit",
  VIEW: "view",
} as const;

export const TAB_MODES = {
  TABLE: "table",
  FORM: "form",
} as const;

export type FormMode = (typeof FORM_MODES)[keyof typeof FORM_MODES];
export type TabMode = (typeof TAB_MODES)[keyof typeof TAB_MODES];

export interface SelectedRecord {
  recordId: string;
  tabId: string;
}

export interface TabFormState {
  recordId?: string;
  mode?: TabMode;
  formMode?: FormMode;
}
