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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

export interface FieldLayoutEntry {
  colStart?: number;
}

/** Number of columns of the form view grid (`grid-cols-3`). */
export const FORM_GRID_COLUMNS = 3;

/**
 * References whose fields take the full form row by default (long text, memo, rich text),
 * mirroring Classic, which widens text areas but explicitly excludes images.
 */
export const FULL_WIDTH_REFERENCE_IDS: ReadonlySet<string> = new Set([
  FIELD_REFERENCE_CODES.TEXT_LONG.id,
  FIELD_REFERENCE_CODES.MEMO.id,
  FIELD_REFERENCE_CODES.RICH_TEXT.id,
]);

/**
 * A field spans the full row when it is a long-text/memo/rich-text field and the
 * metadata does not define an explicit colspan (an explicit value always wins).
 */
export function isFullWidthField(field: Field): boolean {
  if (field.obuiappColspan != null) return false;
  return FULL_WIDTH_REFERENCE_IDS.has(field.column?.reference ?? "");
}

/** Number of grid columns the field occupies: explicit colspan, full row, or a single column. */
export function getEffectiveColspan(field: Field): number {
  if (field.obuiappColspan != null) {
    return field.obuiappColspan;
  }
  if (isFullWidthField(field)) {
    return FORM_GRID_COLUMNS;
  }
  return 1;
}

/**
 * Computes explicit CSS grid column-start values for fields that require
 * positional overrides (startnewline, startinoddcolumn, full-width fields).
 *
 * Returns a Map<fieldId, FieldLayoutEntry>. Only fields that need an explicit
 * colStart are included — absent entries mean CSS auto-placement applies.
 *
 * Full-width fields always start a new row and close it, so the next field
 * starts on column 1.
 *
 * Known limitation: cursor wrap is a heuristic. obuiappColspan > 1 combined
 * with startinoddcolumn on the immediately following field may be slightly off.
 */
export function computeFieldLayout(fields: Field[]): Map<string, FieldLayoutEntry> {
  const result = new Map<string, FieldLayoutEntry>();
  let cursor = 1;

  for (const field of fields) {
    const colspan = getEffectiveColspan(field);

    if (isFullWidthField(field) || field.startnewline) {
      result.set(field.id, { colStart: 1 });
      cursor = 1 + colspan;
    } else if (field.startinoddcolumn) {
      if (cursor % 2 === 0) {
        result.set(field.id, { colStart: 3 });
        cursor = 3 + colspan;
      } else {
        cursor += colspan;
      }
    } else {
      cursor += colspan;
    }

    if (cursor > FORM_GRID_COLUMNS) cursor = 1;
  }

  return result;
}
