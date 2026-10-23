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
import { applyFormPersonalization, isStatusBarRecord, STATUS_BAR_GROUP } from "./formPersonalization";

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
  /** Whether the column has a default value, which lets a mandatory field be hidden. */
  hasDefault: boolean;
  /** Whether the dictionary shows the field in the status bar. */
  wasInStatusBar: boolean;
  /** Whether the field only appears while its display logic holds, so a record may not show it. */
  conditional: boolean;
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
  // Where a field sits and whether it is hidden comes from the stored record when there is one: a hidden
  // status bar field has left the bar in the applied fields, but it still belongs to that group here.
  const records = new Map((form?.fields ?? []).filter((r) => !r.isSection).map((r) => [r.name, r]));

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
      hidden: records.has(field.hqlName)
        ? Boolean(records.get(field.hqlName)?.hiddenInForm)
        : Boolean(original.displayed) && !field.displayed,
      colSpan: clampColSpan(field.obuiappColspan ?? MIN_COL_SPAN),
      rowSpan: field.obuiappRowspan ?? undefined,
      startRow: Boolean(field.startnewline),
      firstFocus: Boolean(field.isFirstFocusedField),
      mandatory: Boolean(field.isMandatory),
      hasDefault: Boolean(original.hasDefaultValue),
      wasInStatusBar: Boolean(original.shownInStatusBar),
      conditional: Boolean(original.displayLogicExpression || original.displayLogic),
    };

    const record = records.get(field.hqlName);
    if (record ? isStatusBarRecord(record) : field.shownInStatusBar) {
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
      ...(item.firstFocus && !inStatusBar ? { firstFocus: true } : {}),
    });
  }

  return { fields };
}

/**
 * Whether the field may be left out of the form. As in Classic, a mandatory field without a default value
 * could not be saved, so it stays, unless the status bar was where it came from.
 */
export const canHideField = (field: EditorField): boolean =>
  !field.mandatory || field.hasDefault || field.wasInStatusBar;

/** Whether the field may go in the status bar, with the same rule Classic's drag and drop applies. */
export const canShowInStatusBar = (field: EditorField): boolean => canHideField(field);

/** The fields the rows put in the status bar: the ones right after its header, before the first section. */
export function statusBarFields(items: EditorItem[]): EditorField[] {
  const fields: EditorField[] = [];
  for (const item of items.slice(1)) {
    if (item.kind === "section") break;
    fields.push(item);
  }
  return fields;
}

const sectionStartIn = (rows: EditorItem[], index: number): number => {
  let start = index;
  while (start > 0 && rows[start].kind !== "section") start--;
  return start;
};

const sectionEndIn = (rows: EditorItem[], index: number): number => {
  let end = index + 1;
  while (end < rows.length && rows[end].kind !== "section") end++;
  return end;
};

/**
 * The rows after dragging the one at `from` onto the position of the one at `to`. A field moves alone. A
 * section moves with its fields (the rows below its header up to the next section), and lands between
 * sections, never inside another section's fields or in the status bar.
 *
 * @param rows the editor rows below the status bar header, in display order
 */
export function moveEditorRow(rows: EditorItem[], from: number, to: number): EditorItem[] {
  const moved = rows[from];
  if (!moved || from === to) {
    return rows;
  }
  if (moved.kind !== "section") {
    const next = [...rows];
    next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }

  const block = rows.slice(from, sectionEndIn(rows, from));
  const rest = [...rows.slice(0, from), ...rows.slice(from + block.length)];

  // A target inside a section sends the block before or after that whole section, by the direction of the move
  const targetIndex = rest.indexOf(rows[to]);
  const firstSection = rest.findIndex((row) => row.kind === "section");
  let insertAt: number;
  if (firstSection === -1) {
    insertAt = rest.length;
  } else if (targetIndex < firstSection) {
    insertAt = firstSection;
  } else if (to < from) {
    insertAt = sectionStartIn(rest, targetIndex);
  } else {
    insertAt = sectionEndIn(rest, targetIndex);
  }
  return [...rest.slice(0, insertAt), ...block, ...rest.slice(insertAt)];
}

/** Ids of the sections the rows open expanded; the main section always is, as in the form. */
export function expandedSectionIds(items: EditorItem[]): string[] {
  const ids = items.filter((item) => item.kind === "section" && !item.statusBar && item.expanded).map((i) => i.id);
  return ids.includes(MAIN_SECTION_ID) ? ids : [MAIN_SECTION_ID, ...ids];
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
