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

import type { EntityData, Field, RefListField } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell, MRT_Row } from "material-react-table";

/**
 * Validation error for a specific field
 */
export interface ValidationError {
  field: string;
  message: string;
  type: "required" | "format" | "server";
}

/**
 * Result of row validation
 */
export interface RowValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Data for a row that is currently being edited
 */
export interface EditingRowData {
  /** Original data before any modifications */
  originalData: EntityData;
  /** Modified data with user changes */
  modifiedData: Partial<EntityData>;
  /** Whether this is a new row being created */
  isNew: boolean;
  /** Current validation errors for this row */
  validationErrors: Record<string, string | undefined>;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Whether the row has unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether callout values are currently being applied (prevents callout loops) */
  isApplyingCalloutValues?: boolean;
}

/**
 * State tracking all rows currently being edited
 */
export interface EditingRowsState {
  [rowId: string]: EditingRowData;
}

/**
 * Context menu state for inline editing
 */
export interface InlineEditingContextMenu {
  anchorEl: HTMLElement | null;
  cell: MRT_Cell<EntityData> | null;
  row: MRT_Row<EntityData> | null;
  showInlineOptions: boolean;
}

/**
 * Complete inline editing state
 */
export interface InlineEditingState {
  editingRows: EditingRowsState;
  contextMenu: InlineEditingContextMenu;
}

/**
 * Props for cell editor components
 */
export interface CellEditorProps {
  value: unknown;
  onChange: (value: unknown, optionData?: Record<string, unknown>) => void;
  onBlur: () => void;
  field: Field;
  hasError: boolean;
  disabled: boolean;
  rowId?: string;
  columnId?: string;
  keyboardNavigationManager?: any; // KeyboardNavigationManager type
  shouldAutoFocus?: boolean; // Controls whether this cell should receive initial focus
  // Optional functions for dynamic option loading (TABLEDIR fields)
  loadOptions?: (field: Field, searchQuery?: string) => Promise<RefListField[]>;
  isLoadingOptions?: (fieldName: string) => boolean;
}

/**
 * Save operation data
 */
export interface SaveOperation {
  rowId: string;
  isNew: boolean;
  data: Partial<EntityData>;
  originalData?: EntityData;
}

/**
 * Result of a save operation
 */
export interface SaveResult {
  success: boolean;
  data?: EntityData;
  errors?: ValidationError[];
}

/**
 * Utility functions for managing editing row state
 */
export interface EditingRowStateUtils {
  /** Add a row to editing state */
  addEditingRow: (rowId: string, data: EntityData, isNew?: boolean) => void;
  /** Remove a row from editing state */
  removeEditingRow: (rowId: string) => void;
  /** Update cell value in editing row */
  updateCellValue: (rowId: string, fieldName: string, value: unknown) => void;
  /** Set validation errors for a row */
  setRowValidationErrors: (rowId: string, errors: Record<string, string | undefined>) => void;
  /** Set saving state for a row */
  setRowSaving: (rowId: string, isSaving: boolean) => void;
  /** Set whether callout values are being applied */
  setCalloutApplying: (rowId: string, isApplying: boolean) => void;
  /** Check if a row is being edited */
  isRowEditing: (rowId: string) => boolean;
  /** Get editing data for a row */
  getEditingRowData: (rowId: string) => EditingRowData | undefined;
  /** Get all editing row IDs */
  getEditingRowIds: () => string[];
  /** Clear all editing state */
  clearAllEditingRows: () => void;
}
