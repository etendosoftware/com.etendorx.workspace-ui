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

/** Length Classic gives a `documentno` column that has none (`StringUIDefinition.getGridFieldProperties`). */
const DOCUMENT_NO_COLUMN = "documentno";
const DOCUMENT_NO_DEFAULT_LENGTH = 20;

interface ColumnWithLength {
  column?: { length?: number | string | null; dBColumnName?: string | null };
}

/**
 * Maximum number of characters a text input accepts, as in Classic: the length of the column. A missing,
 * zero or negative length means no limit. In the grid Classic also gives a `documentno` column with no
 * length a limit of 20; the form does not apply that rule.
 *
 * @param field - The field whose column holds the length
 * @param options.grid - Whether the input is a grid cell editor
 * @returns The limit to set as `maxLength`, or `undefined` when the input has none
 */
export const getTextMaxLength = (field: ColumnWithLength, options: { grid?: boolean } = {}): number | undefined => {
  let length = Number(field.column?.length);
  if (
    options.grid &&
    !(length > 0) &&
    field.column?.dBColumnName?.toLowerCase() === DOCUMENT_NO_COLUMN &&
    length === 0
  ) {
    length = DOCUMENT_NO_DEFAULT_LENGTH;
  }
  return length > 0 ? length : undefined;
};

/**
 * Copies the column length (and the database column name, used by the `documentno` rule) from the metadata
 * field of a tab to the field a grid cell editor receives, whose `column` only carries a few properties.
 * Without it the text editors of the grid cannot cap the input.
 *
 * @param editorField - The field built for the cell editor (modified in place)
 * @param originalField - The field of the tab metadata the editor field comes from
 */
export const copyColumnLength = <T extends { column?: object }>(editorField: T, originalField: ColumnWithLength): T => {
  const { length, dBColumnName } = originalField.column ?? {};
  if (length === undefined && !dBColumnName) {
    return editorField;
  }
  editorField.column = {
    ...editorField.column,
    ...(length !== undefined ? { length } : {}),
    ...(dBColumnName ? { dBColumnName } : {}),
  };
  return editorField;
};
