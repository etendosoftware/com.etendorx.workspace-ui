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

export interface FieldLayoutEntry {
  colStart?: number;
}

/**
 * Computes explicit CSS grid column-start values for fields that require
 * positional overrides (startnewline, startinoddcolumn).
 *
 * Returns a Map<fieldId, FieldLayoutEntry>. Only fields that need an explicit
 * colStart are included — absent entries mean CSS auto-placement applies.
 *
 * Known limitation: cursor wrap is a heuristic. obuiappColspan > 1 combined
 * with startinoddcolumn on the immediately following field may be slightly off.
 */
export function computeFieldLayout(fields: Field[]): Map<string, FieldLayoutEntry> {
  const result = new Map<string, FieldLayoutEntry>();
  let cursor = 1;

  for (const field of fields) {
    const colspan = field.obuiappColspan ?? 1;

    if (field.startnewline) {
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

    if (cursor > 3) cursor = 1;
  }

  return result;
}
