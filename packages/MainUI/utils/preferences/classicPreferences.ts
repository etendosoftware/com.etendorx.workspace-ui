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

import { getStoredPreference } from "@/utils/propertyStore";
import { PREFERENCE_ENABLED_VALUE } from "@/utils/preferences/refreshAfterDeletion";
import { UIPattern, type Tab } from "@workspaceui/api-client/src/api/types";
import { DEFAULT_PAGE_SIZE } from "@/utils/table/constants";

/**
 * Classic interface preferences honoured by the new UI. Every one is looked up as classic
 * `OB.PropertyStore.get(name, windowId)` does: the window-scoped value first, the global one second.
 */
export const CLASSIC_PREFERENCES = {
  /** Shows accounting tabs (`AD_Tab.IsAccountingTab`) and feeds `@#ShowAcct@` in processes. */
  SHOW_ACCOUNTING: "ShowAcct",
  /** Shows translation tabs (`AD_Tab.IsTranslationTab`). */
  SHOW_TRANSLATION: "ShowTrl",
  /** Feeds `@FinancialManagement@` in process display logic. */
  FINANCIAL_MANAGEMENT: "FinancialManagement",
  /** Window (as `/?tabId=...`) opened right after login. */
  START_PAGE: "StartPage",
  /** Address the browser goes to after a manual logout. */
  LOGOUT_REDIRECT_URL: "LogoutRedirectURL",
  /** Opens the audit section of the form expanded. */
  SHOW_AUDIT_DEFAULT: "ShowAuditDefault",
  /** Prevents adding or deleting notes in read-only tabs. */
  DISABLE_NOTES_FOR_READ_ONLY_TABS: "DisableNotesForReadOnlyTabs",
  /** With No, only users that manage views can save, delete or personalize. */
  WINDOW_PERSONALIZATION: "OBUIAPP_WindowPersonalization_Override",
  /** Hides the Linked Items section of the form. */
  DISABLE_LINKED_ITEMS_SECTION: "OBUIAPP_DisableLinkedItemsSection",
  /** Number of records per grid page. */
  DATA_PAGE_SIZE: "dataPageSize",
} as const;

/** Values classic `OBUIAPP_WindowPersonalization_Override` treats as "disabled". */
const DISABLED_VALUES = new Set(["N", "FALSE"]);

/**
 * True when the preference is Y (`OB.PropertyStore.get(name, windowId) === 'Y'`).
 *
 * @param name - Preference property name
 * @param windowId - AD window id to scope the lookup to, when known
 */
export function isPreferenceYes(name: string, windowId?: string): boolean {
  return getStoredPreference(name, windowId) === PREFERENCE_ENABLED_VALUE;
}

/**
 * True when the preference is explicitly disabled: `N` or `false`, the values classic checks for
 * window personalization. A missing preference is not disabled.
 *
 * @param name - Preference property name
 * @param windowId - AD window id to scope the lookup to, when known
 */
export function isPreferenceDisabled(name: string, windowId?: string): boolean {
  const value = getStoredPreference(name, windowId);
  return value !== undefined && DISABLED_VALUES.has(value.toUpperCase());
}

/**
 * Positive integer value of a preference, or the fallback when it is missing or not a positive
 * number (classic `OB.PropertyStore.get(name, windowId) || fallback`).
 *
 * @param name - Preference property name
 * @param windowId - AD window id to scope the lookup to, when known
 * @param fallback - Value used when the preference does not hold a positive integer
 */
export function getNumericPreference(name: string, windowId: string | undefined, fallback: number): number {
  const value = Number.parseInt(getStoredPreference(name, windowId) ?? "", 10);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return fallback;
}

/**
 * Preference values a process reads in its display logic, resolved as classic does: `@FinancialManagement@`
 * from the preference of the window (`Utility.getContext`), and `@#ShowAcct@` from the global `ShowAcct`
 * value stored in the session at login (`LoginUtils.fillSessionArguments`). A missing preference is empty.
 *
 * @param windowId - AD window id the process is launched from
 * @returns The `FinancialManagement` and `_ShowAcct` context entries
 */
export function buildProcessPreferenceContext(windowId?: string): { FinancialManagement: string; _ShowAcct: string } {
  return {
    FinancialManagement: getStoredPreference(CLASSIC_PREFERENCES.FINANCIAL_MANAGEMENT, windowId) ?? "",
    _ShowAcct: getStoredPreference(CLASSIC_PREFERENCES.SHOW_ACCOUNTING) ?? "",
  };
}

/**
 * Classic `DisableNotesForReadOnlyTabs`: with Y, notes cannot be added or deleted in a read-only tab. The
 * metadata marks a tab read-only through its UI pattern, both for a read-only tab and for a role with
 * read-only access, the two cases classic `NoteEventHandler` checks.
 *
 * @param tab - Tab the form belongs to
 * @returns true when the notes section must not let the user change notes
 */
export function areNotesReadOnly(tab: Pick<Tab, "uIPattern" | "window">): boolean {
  return (
    tab.uIPattern === UIPattern.READ_ONLY &&
    isPreferenceYes(CLASSIC_PREFERENCES.DISABLE_NOTES_FOR_READ_ONLY_TABS, tab.window)
  );
}

/**
 * Classic `OBUIAPP_DisableLinkedItemsSection`: with Y the form does not show the Linked Items section.
 *
 * @param windowId - AD window id of the form
 * @returns true when the Linked Items section must be hidden
 */
export function isLinkedItemsSectionDisabled(windowId?: string): boolean {
  return isPreferenceYes(CLASSIC_PREFERENCES.DISABLE_LINKED_ITEMS_SECTION, windowId);
}

/**
 * Records per grid page: classic `OB.PropertyStore.get('dataPageSize', windowId) || 100` in `OBViewGrid`.
 *
 * @param windowId - AD window id of the grid
 * @returns The page size of the window, or the default one
 */
export function getGridPageSize(windowId?: string): number {
  return getNumericPreference(CLASSIC_PREFERENCES.DATA_PAGE_SIZE, windowId, DEFAULT_PAGE_SIZE);
}

/** Role user levels (`AD_Role.UserLevel`) of client and system administrators, who manage views for others. */
const ADMIN_USER_LEVELS = ["C", "S"];

/**
 * Classic `OBUIAPP_WindowPersonalization_Override` set to No: a user without administration rights can only
 * pick existing saved views, and cannot save, delete, set a default view or personalize the form.
 * Administrators (the same roles that may save shared views) are never blocked.
 *
 * @param windowId - AD window id of the tab
 * @param userLevel - User level of the current role
 * @returns true when the window personalization is blocked for the current user
 */
export function isWindowPersonalizationBlocked(windowId: string | undefined, userLevel: string | undefined): boolean {
  const isAdmin = ADMIN_USER_LEVELS.some((level) => (userLevel ?? "").includes(level));
  return !isAdmin && isPreferenceDisabled(CLASSIC_PREFERENCES.WINDOW_PERSONALIZATION, windowId);
}
