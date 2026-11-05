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

/**
 * Rules for saving an inline-edited row when the user leaves it, as the classic UI does: in every tab
 * that allows editing, whatever its UI pattern.
 */

/**
 * Row to save when the user clicks a row other than the one being edited, or null when there is none.
 * Only a row with pending changes is saved; an untouched editing row is left as it is.
 */
export function getRowToSaveOnRowClick(
  clickedRowId: string,
  editingRowIds: string[],
  hasUnsavedChanges: (rowId: string) => boolean
): string | null {
  if (editingRowIds.length === 0 || editingRowIds.includes(clickedRowId)) return null;
  const editingRowId = editingRowIds[0];
  return hasUnsavedChanges(editingRowId) ? editingRowId : null;
}

/**
 * Whether a row that lost the focus (to a cell of another row, a click or the keyboard) must be saved.
 * A new row is always saved; an existing one only when it has pending changes.
 */
export function shouldSaveOnRowBlur(isNewRow: boolean, hasUnsavedChanges: boolean): boolean {
  return isNewRow || hasUnsavedChanges;
}
