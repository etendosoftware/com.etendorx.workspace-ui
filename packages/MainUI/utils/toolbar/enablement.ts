/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may not use this file except in compliance with the License at
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

import { resolvePreference } from "@/utils/propertyStore";
import { UIPattern } from "@workspaceui/api-client/src/api/types";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";

/** Preference that disables the Delete button of every tab of a window (classic `allowDelete`). */
export const ALLOW_DELETE_PREFERENCE = "AllowDelete";
/** Preference that disables the Export button (classic `ExportToCsv`). */
export const EXPORT_TO_CSV_PREFERENCE = "ExportToCsv";
/** Preference that disables the Attachments button (classic `allowAttachment`). */
export const ALLOW_ATTACHMENT_PREFERENCE = "AllowAttachment";

/**
 * True when a classic Y/N preference is set to "No", looked up by window first and globally second
 * (`OB.PropertyStore.get(name, windowId) === 'N'`). A missing preference leaves the button enabled.
 */
export const isPreferenceNo = (name: string, windowId?: string): boolean => {
  const value = resolvePreference(name, windowId);
  return value === false || String(value ?? "").toUpperCase() === "N";
};

/** A record the user cannot delete: processed or read-only for the security layer, or not saved yet. */
const isUndeletableRecord = (record: EntityData): boolean => record._readOnly === true || record._new === true;

interface DeleteRulesInput {
  tab: Tab;
  selectedRecords: EntityData[];
  isNewRecord: boolean;
  hasParentRecordSelected: boolean;
}

/**
 * Classic `DELETE_BUTTON_PROPERTIES.updateState` rules beyond "something is selected": the table must allow
 * deleting, the tab must not be read-only or single-record, the `AllowDelete` preference must not be No, the
 * tab needs its parent record, and no selected record can be processed, read-only or still new.
 */
export const isDeleteBlocked = ({ tab, selectedRecords, isNewRecord, hasParentRecordSelected }: DeleteRulesInput) => {
  const pattern = tab.uIPattern;
  if (pattern === UIPattern.READ_ONLY || pattern === UIPattern.EDIT_ONLY) return true;
  if (tab.deletableRecords === false) return true;
  if (isPreferenceNo(ALLOW_DELETE_PREFERENCE, tab.window)) return true;
  if (!hasParentRecordSelected || isNewRecord) return true;
  return selectedRecords.some(isUndeletableRecord);
};

interface ExportRulesInput {
  tab: Tab;
  isFormView: boolean;
  /** True while the tab shows its tree (not merely supports it). */
  isTreeView?: boolean;
  /** False when the grid has no rows; unknown (undefined) is treated as having rows. */
  hasGridRows?: boolean;
}

/**
 * Classic `EXPORT_BUTTON_PROPERTIES.updateState`: no export from the form or the tree, with an empty grid, or
 * when the `ExportToCsv` preference is No.
 */
export const isExportBlocked = ({ tab, isFormView, isTreeView, hasGridRows }: ExportRulesInput) =>
  isFormView || Boolean(isTreeView) || hasGridRows === false || isPreferenceNo(EXPORT_TO_CSV_PREFERENCE, tab.window);

/**
 * Classic clone rule: the form cannot be cloned while it has unsaved changes or the record is still new
 * (`form.hasChanged`, `form.isNew`).
 */
export const isCloneBlockedByForm = ({
  hasFormChanges,
  isNewRecord,
}: { hasFormChanges: boolean; isNewRecord: boolean }) => hasFormChanges || isNewRecord;

/** The `AllowAttachment` preference set to No disables the Attachments button. */
export const isAttachmentBlockedByPreference = (tab: Tab): boolean =>
  isPreferenceNo(ALLOW_ATTACHMENT_PREFERENCE, tab.window);
