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

/**
 * Represents the complete state of a window in the multi-window navigation system.
 * This interface defines all the data needed to restore and manage a window's state through URL parameters.
 *
 * @interface WindowState
 */
export interface WindowState {
  /**
   * Unique identifier for the window, typically corresponds to the window entity ID from the API.
   * Used for business logic operations and state management.
   */
  windowId: string;

  /**
   * Indicates whether this window is currently active/focused.
   * Only one window can be active at a time in the multi-window system.
   */
  isActive: boolean;

  /**
   * URL-safe identifier used in URL parameters to represent this window instance.
   * Allows multiple instances of the same windowId to exist simultaneously.
   * Format: typically `${windowId}_${timestamp}` or similar unique suffix.
   */
  window_identifier: string;

  /**
   * Display title for the window tab.
   * Shown in the tab bar and used for user identification of windows.
   */
  title: string;
}