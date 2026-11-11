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

import type { ColumnDef } from "@/components/Form/FormView/selectors/components/types";
import type { SelectorColumn } from "@workspaceui/api-client/src/api/types";

/** Reference id of the Yes/No (checkbox) type. */
const YES_NO_REFERENCE_ID = "20";

/**
 * Columns of the dropdown of a selector, as Classic shows them (the "picklist"): the display field followed by
 * the extra fields the selector flags for it. The dropdown only becomes a table when there is more than one.
 *
 * @param pickListColumns - `selector.pickListColumns` sent with the field metadata.
 * @returns The columns to render, or `undefined` to keep the single-column dropdown.
 */
export const getPickListColumns = (pickListColumns?: SelectorColumn[]): ColumnDef[] | undefined => {
  if (!Array.isArray(pickListColumns) || pickListColumns.length < 2) {
    return undefined;
  }
  return pickListColumns.map(({ accessorKey, header, referenceId }) => ({ accessorKey, header, referenceId }));
};

const isTrue = (value: unknown): boolean => value === true || value === "true" || value === "Y";

/**
 * Text of a cell of the dropdown table: Yes/No columns show a checked or unchecked box, as Classic does;
 * foreign keys show their identifier.
 */
export const formatPickListCell = (raw: unknown, identifier: unknown, referenceId?: string): string => {
  if (referenceId === YES_NO_REFERENCE_ID || typeof raw === "boolean") {
    return isTrue(raw) ? "\u2611" : "\u2610";
  }
  const value = identifier ?? raw;
  return value === undefined || value === null || value === "" ? "-" : String(value);
};
