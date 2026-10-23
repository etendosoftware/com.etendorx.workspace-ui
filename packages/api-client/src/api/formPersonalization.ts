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

import { Metadata } from "./metadata";

export const FORM_PERSONALIZATION_PATH = "meta/form-personalization";

/** Levels a form personalization can be stored at, from the most specific to the widest. */
export type FormPersonalizationScope = "USER" | "ROLE" | "ORGANIZATION" | "CLIENT" | "SYSTEM";

/**
 * One entry of the personalized form: a field or a section, in display order. It is the same shape
 * Classic's "Personalize Form" stores, so a personalization made in either UI applies in both.
 */
export interface FormPersonalizationRecord {
  /** Property name of the field (`hqlName`), or the id of the field group for a section. */
  name: string;
  title?: string;
  isSection?: boolean;
  /** Id of the section the field belongs to, or `_statusBar` for the status bar. */
  parentName?: string | null;
  isStatusBarField?: boolean;
  hiddenInForm?: boolean;
  colSpan?: number;
  rowSpan?: number;
  /** The field starts a new row. */
  startRow?: boolean;
  /** The field that receives the focus when the form opens. */
  firstFocus?: boolean;
  /** Whether the section is expanded when the form opens. */
  sectionExpanded?: boolean;
  [key: string]: unknown;
}

export interface FormPersonalizationForm {
  fields: FormPersonalizationRecord[];
  [key: string]: unknown;
}

export interface StoredFormPersonalization {
  id: string;
  scope: FormPersonalizationScope;
  form: FormPersonalizationForm;
  /** Whether the current session may overwrite or discard it. */
  canEdit: boolean;
}

export interface FormPersonalizationPermissions {
  /** Levels the current session may save at. */
  scopes: FormPersonalizationScope[];
  /** Roles the session administers (for the ROLE level). */
  roles: { id: string; name: string }[];
  /** Organizations the session administers (for the ORGANIZATION level). */
  organizations: { id: string; name: string }[];
}

export interface FormPersonalizationState {
  tab: string;
  /** The personalization that applies to the session, or null to use the layout defined in the dictionary. */
  personalization: StoredFormPersonalization | null;
  permissions: FormPersonalizationPermissions;
}

export interface SaveFormPersonalizationParams {
  tabId: string;
  form: FormPersonalizationForm;
  scope?: FormPersonalizationScope;
  /** Target role for the ROLE level, the current one by default. */
  role?: string;
  /** Target organization for the ORGANIZATION level, the current one by default. */
  organization?: string;
}

/** Reads the form personalization that applies to the current session for a tab. */
export async function fetchFormPersonalization(tabId: string): Promise<FormPersonalizationState> {
  const response = await Metadata.client.request(`${FORM_PERSONALIZATION_PATH}?tab=${encodeURIComponent(tabId)}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch the form personalization: ${response.status}`);
  }
  return response.data as FormPersonalizationState;
}

/** Stores the personalized form of a tab at one level. The response holds the stored record. */
export async function saveFormPersonalization(
  params: SaveFormPersonalizationParams
): Promise<FormPersonalizationState> {
  const { tabId, form, scope, role, organization } = params;
  const response = await Metadata.client.request(FORM_PERSONALIZATION_PATH, {
    method: "POST",
    body: JSON.stringify({ tab: tabId, form, scope, role, organization }),
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to save the form personalization: ${response.status}`);
  }
  return response.data as FormPersonalizationState;
}

/** Discards a stored personalization, which restores the layout defined in the dictionary. */
export async function deleteFormPersonalization(id: string): Promise<void> {
  const response = await Metadata.client.request(`${FORM_PERSONALIZATION_PATH}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to discard the form personalization: ${response.status}`);
  }
}
