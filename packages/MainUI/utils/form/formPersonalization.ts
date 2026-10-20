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

import type {
  FormPersonalizationForm,
  FormPersonalizationRecord,
} from "@workspaceui/api-client/src/api/formPersonalization";
import type { Field } from "@workspaceui/api-client/src/api/types";

/** Name Classic gives to the group that holds the status bar fields. */
export const STATUS_BAR_GROUP = "_statusBar";

const MIN_COL_SPAN = 1;
const MAX_COL_SPAN = 3;

const clampColSpan = (colSpan: number): number => Math.min(MAX_COL_SPAN, Math.max(MIN_COL_SPAN, Math.round(colSpan)));

const isStatusBarRecord = (record: FormPersonalizationRecord): boolean =>
  record.isStatusBarField === true || record.parentName === STATUS_BAR_GROUP;

/**
 * Applies a personalized form (the records Classic's "Personalize Form" stores) to the fields of a tab:
 * order, visibility, section, column span, row start, status bar and initial focus. The result has the
 * same shape as the original, so everything that builds the form from it keeps working.
 *
 * - Fields the personalization does not mention keep their position, after the personalized ones, so a
 *   field added to the dictionary later is not lost.
 * - A personalization can hide a field but never shows one the dictionary does not display.
 * - When no field is marked as the initial focus the dictionary's choice is kept.
 *
 * @param fields the fields of the tab, as defined in the dictionary
 * @param form the personalized form, if any
 * @returns the fields with the personalization applied; the same object when there is nothing to apply
 */
export function applyFormPersonalization(
  fields: Record<string, Field>,
  form: FormPersonalizationForm | null | undefined
): Record<string, Field> {
  const records = form?.fields;
  if (!records?.length) {
    return fields;
  }

  const sections = new Map<string, FormPersonalizationRecord>();
  const fieldRecords = new Map<string, { record: FormPersonalizationRecord; index: number }>();
  records.forEach((record, index) => {
    if (record.isSection) {
      sections.set(record.name, record);
    } else if (!fieldRecords.has(record.name)) {
      fieldRecords.set(record.name, { record, index });
    }
  });

  const groupLabels = new Map<string, string>();
  for (const field of Object.values(fields)) {
    const label = field.fieldGroupName || field.fieldGroup$_identifier;
    if (field.fieldGroup && label) {
      groupLabels.set(field.fieldGroup, label);
    }
  }

  const focusedName = [...fieldRecords.entries()].find(([, entry]) => entry.record.firstFocus)?.[0];
  const unmentionedOffset = records.length + 1;

  // The form draws the fields of a section in the order of this object, not by `sequenceNumber`, so the
  // personalized order has to be the insertion order: first the fields the personalization mentions, in its
  // order, then the rest as the dictionary had them.
  const ordered = Object.entries(fields)
    .map(([key, field], position) => ({ key, field, position, entry: fieldRecords.get(field.hqlName) }))
    .sort((a, b) => {
      if (a.entry && b.entry) return a.entry.index - b.entry.index;
      if (a.entry) return -1;
      if (b.entry) return 1;
      return a.position - b.position;
    });

  const personalized: Record<string, Field> = {};
  for (const { key, field, entry } of ordered) {
    if (!entry) {
      personalized[key] = { ...field, sequenceNumber: unmentionedOffset + (field.sequenceNumber ?? 0) };
      continue;
    }

    const { record, index } = entry;
    const next: Field = { ...field, sequenceNumber: index + 1 };

    if (record.hiddenInForm) {
      next.displayed = false;
    }

    const inStatusBar = isStatusBarRecord(record);
    next.shownInStatusBar = inStatusBar;

    if (!inStatusBar && record.parentName) {
      next.fieldGroup = record.parentName;
      const label = sections.get(record.parentName)?.title || groupLabels.get(record.parentName);
      if (label) {
        next.fieldGroupName = label;
        next.fieldGroup$_identifier = label;
      }
      const section = sections.get(record.parentName);
      if (section?.sectionExpanded !== undefined) {
        next.fieldGroupCollapsed = !section.sectionExpanded;
      }
    }

    if (typeof record.colSpan === "number") {
      next.obuiappColspan = clampColSpan(record.colSpan);
    }
    if (typeof record.rowSpan === "number") {
      next.obuiappRowspan = record.rowSpan;
    }
    if (typeof record.startRow === "boolean") {
      next.startnewline = record.startRow;
    }
    if (focusedName !== undefined) {
      next.isFirstFocusedField = field.hqlName === focusedName;
    }

    personalized[key] = next;
  }

  return personalized;
}
