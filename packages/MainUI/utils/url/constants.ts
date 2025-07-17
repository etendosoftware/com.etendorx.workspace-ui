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
