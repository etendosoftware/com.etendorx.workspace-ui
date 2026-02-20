/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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
 * @fileoverview Types for the GenericWarehouseProcess plugin system.
 *
 * These types define the contract between:
 * - The module (packing/picking) that declares the plugin via onLoad/onProcess/payscript fields
 * - The UI (GenericWarehouseProcess) that renders and executes it
 */

// ---------------------------------------------------------------------------
// Grid column config
// ---------------------------------------------------------------------------

export interface WarehouseGridColumn {
  /** Field name in the line data object */
  field: string;
  /** i18n label key (used with t()) */
  labelKey: string;
  /** Whether this column is editable inline */
  editable?: boolean;
  /** Alignment for the cell content */
  align?: "left" | "right" | "center";
  /** Whether to show this column (defaults to true) */
  visible?: boolean;
}

// ---------------------------------------------------------------------------
// Input bar element types
// ---------------------------------------------------------------------------

export type InputBarElement = "boxSelector" | "addBox" | "qty" | "barcode" | "checkCalculate";

// ---------------------------------------------------------------------------
// Process features flags
// ---------------------------------------------------------------------------

export interface WarehouseProcessFeatures {
  /** Whether boxes can be added dynamically (default: true) */
  dynamicBoxes?: boolean;
  /** Whether to show the "Calculate Weight" checkbox (default: false) */
  calculateWeight?: boolean;
  /** Whether to track scannedInputs per line (default: false, used in picking) */
  trackScannedInputs?: boolean;
}

// ---------------------------------------------------------------------------
// onScan result returned by the Payscript onScan hook
// ---------------------------------------------------------------------------

export interface OnScanResult {
  /** Field name to match a line (e.g. 'shipmentLineId', 'productId') */
  matchField: string;
  /** Value to match against */
  matchValue: string;
  /** Quantity to add to the matched line's current box */
  qty: number;
  /**
   * The actual barcode code to record in scannedInputs (e.g. normalized code returned by backend).
   * Falls back to the raw user input if not provided.
   */
  scannedCode?: string;
  /** If true, the scan failed and an error should be shown */
  error?: false;
}

export interface OnScanError {
  error: true;
  /** Optional backend-provided error message to show instead of the generic fallback */
  message?: string;
}

// ---------------------------------------------------------------------------
// Payscript warehouse plugin shape
// (registered in the Payscript registry via EM_Etmeta_Payscript field)
// ---------------------------------------------------------------------------

export interface WarehousePayScriptPlugin {
  id?: string;
  /**
   * Called when a barcode is scanned.
   * Receives scan context and a callAction helper to call backend action handlers.
   * Returns which line to update and by how much, or { error: true } on failure.
   */
  onScan: (ctx: OnScanContext) => Promise<OnScanResult | OnScanError>;
}

export interface OnScanContext {
  barcode: string;
  qty: number;
  currentBox: number;
  lines: WarehouseLine[];
  callAction: (actionHandler: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Line shape — generic enough for both packing and picking
// ---------------------------------------------------------------------------

export interface WarehouseLine {
  productId: string;
  shipmentLineId: string;
  quantity: number;
  qtyVerified: number;
  qtyPending: number;
  boxed?: number;
  scannedInputs?: { code: string; qty: number }[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Plugin schema — returned by onLoad evaluation
// ---------------------------------------------------------------------------

export interface WarehouseProcessSchema {
  /**
   * Discriminator so ProcessDefinitionModal knows to render GenericWarehouseProcess.
   * Must always be 'warehouseProcess'.
   */
  type: "warehouseProcess";

  /** Title shown in the modal header (i18n key) */
  titleKey: string;

  /** Which elements appear in the top input bar, left to right */
  inputBar: InputBarElement[];

  /** Column definitions for the grid */
  gridColumns: WarehouseGridColumn[];

  /** Feature flags */
  features: WarehouseProcessFeatures;

  /** Initial line data returned by the backend open action */
  initialData: {
    lines: WarehouseLine[];
    boxCount: number;
    windowId?: string;
    valuecheck?: boolean;
  };

  /** The record ID that was used to initialize (shipmentId or pickingListId) */
  recordId: string;
}
