export type StandardButtonId =
  | 'NEW'
  | 'REFRESH'
  | 'SAVE'
  | 'DELETE'
  | 'EXPORT'
  | 'ATTACHMENTS'
  | 'FIND'
  | 'GRID_VIEW'
  | 'TAB_CONTROL';

export type ButtonId = StandardButtonId | string;

export const BUTTON_IDS = {
  NEW: 'NEW',
  REFRESH: 'REFRESH',
  SAVE: 'SAVE',
  DELETE: 'DELETE',
  EXPORT: 'EXPORT',
  ATTACHMENTS: 'ATTACHMENTS',
  FIND: 'FIND',
  GRID_VIEW: 'GRID_VIEW',
  PROCESS: 'PROCESS',
  TAB_CONTROL: 'TAB_CONTROL',
} as const;

export const LEFT_SECTION_BUTTONS: StandardButtonId[] = [BUTTON_IDS.NEW, BUTTON_IDS.REFRESH, BUTTON_IDS.SAVE];
export const CENTER_SECTION_BUTTONS: StandardButtonId[] = [
  BUTTON_IDS.DELETE,
  BUTTON_IDS.EXPORT,
  BUTTON_IDS.ATTACHMENTS,
];
export const RIGHT_SECTION_BUTTONS: StandardButtonId[] = [
  BUTTON_IDS.FIND,
  BUTTON_IDS.GRID_VIEW,
  BUTTON_IDS.TAB_CONTROL,
];
