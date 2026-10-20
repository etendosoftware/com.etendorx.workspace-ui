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

import type { FormPersonalizationForm } from "@workspaceui/api-client/src/api/formPersonalization";
import { type Field, FieldType } from "@workspaceui/api-client/src/api/types";
import { getFieldReference } from "@/utils";
import { applyFormPersonalization, STATUS_BAR_GROUP } from "./formPersonalization";

/** Id the form gives to the fields that have no field group. */
export const MAIN_SECTION_ID = "_main";

export const MIN_COL_SPAN = 1;
export const MAX_COL_SPAN = 3;

export interface EditorField {
  kind: "field";
  /** `hqlName` of the field. */
  id: string;
  title: string;
  hidden: boolean;
  colSpan: number;
  /** Not editable here; kept as it was. */
  rowSpan?: number;
  startRow: boolean;
  firstFocus: boolean;
  mandatory: boolean;
}

export interface EditorSection {
  kind: "section";
  id: string;
  title: string;
  expanded: boolean;
  /** The group that holds the status bar fields, which has no section of its own in the form. */
  statusBar?: boolean;
}

/**
 * A row of the editor. The list is flat, in display order: a field belongs to the nearest section above
 * it, so moving a field across a section header moves it to that section, and moving a header moves the
 * section's fields with the rows below it.
 */
export type EditorItem = EditorField | EditorSection;

export interface EditorTitles {
  main: string;
  statusBar: string;
}

const clampColSpan = (colSpan: number): number => Math.min(MAX_COL_SPAN, Math.max(MIN_COL_SPAN, Math.round(colSpan)));

/** Whether the form offers the field for personalization: it shows it, or the status bar does. */
const isPersonalizable = (field: Field): boolean => {
  if (
    field.processAction ||
    field.processDefinition ||
    getFieldReference(field.column?.reference) === FieldType.BUTTON
  ) {
    return false;
  }
  return Boolean(field.displayed || field.shownInStatusBar);
};

/**
 * The editor's rows for a tab: the status bar first, then each section with its fields, as the form shows
 * them once the given personalization is applied. Fields the personalization hides are listed (as hidden)
 * so they can be shown again; fields the dictionary never displays are not.
 *
 * @param dictionaryFields the fields of the tab as the dictionary defines them
 * @param form the personalization currently in effect, if any
 * @param titles the labels of the sections the dictionary does not name
 */
export function buildEditorItems(
  dictionaryFields: Record<string, Field>,
  form: FormPersonalizationForm | null | undefined,
  titles: EditorTitles
): EditorItem[] {
  const applied = applyFormPersonalization(dictionaryFields, form);

  const statusBar: EditorField[] = [];
  const sections = new Map<string, { section: EditorSection; fields: EditorField[] }>();

  for (const [key, field] of Object.entries(applied)) {
    const original = dictionaryFields[key];
    if (!original || !isPersonalizable(original)) {
      continue;
    }

    const editorField: EditorField = {
      kind: "field",
      id: field.hqlName,
      title: field.name || field.hqlName,
      hidden: Boolean(original.displayed) && !field.displayed,
      colSpan: clampColSpan(field.obuiappColspan ?? MIN_COL_SPAN),
      rowSpan: field.obuiappRowspan ?? undefined,
      startRow: Boolean(field.startnewline),
      firstFocus: Boolean(field.isFirstFocusedField),
      mandatory: Boolean(field.isMandatory),
    };

    if (field.shownInStatusBar) {
      statusBar.push(editorField);
      continue;
    }

    const sectionId = field.fieldGroup || MAIN_SECTION_ID;
    let entry = sections.get(sectionId);
    if (!entry) {
      entry = {
        section: {
          kind: "section",
          id: sectionId,
          title: field.fieldGroupName || field.fieldGroup$_identifier || titles.main,
          expanded: !field.fieldGroupCollapsed,
        },
        fields: [],
      };
      sections.set(sectionId, entry);
    }
    entry.fields.push(editorField);
  }

  const items: EditorItem[] = [
    { kind: "section", id: STATUS_BAR_GROUP, title: titles.statusBar, expanded: true, statusBar: true },
  ];
  items.push(...statusBar);
  for (const { section, fields } of sections.values()) {
    items.push(section, ...fields);
  }
  return items;
}

/**
 * The personalization form for the editor's rows, in the shape Classic's "Personalize Form" stores.
 * Every field is written, with where it goes and how it looks, so the result does not depend on what the
 * dictionary defines later.
 */
export function editorItemsToForm(items: EditorItem[]): FormPersonalizationForm {
  const fields: FormPersonalizationForm["fields"] = [];
  let sectionId: string = MAIN_SECTION_ID;
  let inStatusBar = false;

  for (const item of items) {
    if (item.kind === "section") {
      inStatusBar = Boolean(item.statusBar);
      sectionId = item.id;
      if (!item.statusBar) {
        fields.push({ name: item.id, title: item.title, isSection: true, sectionExpanded: item.expanded });
      }
      continue;
    }

    fields.push({
      name: item.id,
      title: item.title,
      parentName: inStatusBar ? STATUS_BAR_GROUP : sectionId,
      ...(inStatusBar ? { isStatusBarField: true } : {}),
      hiddenInForm: item.hidden,
      colSpan: item.colSpan,
      ...(item.rowSpan !== undefined ? { rowSpan: item.rowSpan } : {}),
      startRow: item.startRow,
      ...(item.firstFocus ? { firstFocus: true } : {}),
    });
  }

  return { fields };
}

/** Marks one field as the one that receives the focus when the form opens, and clears it on the others. */
export function setFirstFocus(items: EditorItem[], fieldId: string): EditorItem[] {
  return items.map((item) => (item.kind === "field" ? { ...item, firstFocus: item.id === fieldId } : item));
}

/** Replaces one row, leaving the rest as they are. */
export function updateEditorItem<T extends EditorItem>(
  items: EditorItem[],
  id: string,
  change: Partial<T>
): EditorItem[] {
  return items.map((item) => (item.id === id ? ({ ...item, ...change } as EditorItem) : item));
}

/** Whether the rows differ from the other ones in anything the personalization stores. */
export function editorItemsEqual(a: EditorItem[], b: EditorItem[]): boolean {
  return JSON.stringify(editorItemsToForm(a)) === JSON.stringify(editorItemsToForm(b));
}
