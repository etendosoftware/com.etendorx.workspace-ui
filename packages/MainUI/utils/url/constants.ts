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

export const WINDOW_PREFIX = "w_";
export const ORDER_PREFIX = "o_";
export const WINDOW_IDENTIFIER_PREFIX = "wi_";
export const FORM_RECORD_ID_PREFIX = "r_";
export const FORM_MODE_PREFIX = "fm_";
export const TITLE_PREFIX = "t_";
export const SELECTED_RECORD_PREFIX = "s_";

// Tab parameters
export const TAB_FORM_RECORD_ID_PREFIX = "tf_";
export const TAB_MODE_PREFIX = "tm_";
export const TAB_FORM_MODE_PREFIX = "tfm_";

// Tab states
export const TAB_ACTIVE = "active";
export const TAB_INACTIVE = "inactive";

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
