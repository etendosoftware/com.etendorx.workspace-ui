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

import type { ProcessCalloutFunction } from "./processCallouts";
import { logger } from "@/utils/logger";

const VALIDATE_BARCODE_ACTION = "org.openbravo.warehouse.pickinglist.action.ValidateBarcodeAction";
const PICK_VALIDATE_PROCESS_ID = "50D2EB7B24B44EA39C4735AC51CA8E0A";

/**
 * Get auth headers for API calls from localStorage
 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token") || "";
  const csrfToken = localStorage.getItem("csrfToken") || "";
  return {
    "Content-Type": "application/json;charset=UTF-8",
    Authorization: `Bearer ${token}`,
    "X-CSRF-Token": csrfToken,
  };
}

/**
 * Async callout for barcode validation in the Pick & Validate process.
 *
 * This callout:
 * 1. Reads barcode and quantity from form values
 * 2. Calls ValidateBarcodeAction server-side to resolve barcode → shipmentLineId + conversionRate
 * 3. Updates the matching grid row with qtyVerified and scannedInputs
 * 4. Clears the barcode field and resets quantity to 1
 */
export const pickValidateBarcodeCallout: ProcessCalloutFunction = async (formValues, _form, gridSelection) => {
  const barcode = String(formValues.barcode || formValues.Barcode || "").trim();
  const qty = Number(formValues.quantity || formValues.Quantity || 1) || 1;

  if (!barcode) {
    return {};
  }

  // Build validLines from grid selection
  const gridData = gridSelection as Record<string, { _selection?: Record<string, unknown>[] }> | undefined;
  const lines = gridData?.picking_lines?._selection || [];

  const validLines = lines
    .map((rec) => ({
      shipmentLineId: rec.shipmentLineId || rec.inOutLineId || rec.mInOutLineId || rec.lineId || rec.id,
      attributeSetValueId: rec.attributeSetValueId || null,
      productId: rec.productId || null,
    }))
    .filter((c) => c.shipmentLineId);

  try {
    const baseUrl = "/api/erp/org.openbravo.client.kernel";
    const queryParams = new URLSearchParams({
      processId: PICK_VALIDATE_PROCESS_ID,
      _action: VALIDATE_BARCODE_ACTION,
    });

    const response = await fetch(`${baseUrl}?${queryParams.toString()}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        _buttonValue: "DONE",
        _params: {
          barcode,
          validLines,
        },
        _entityName: "OBWPL_pickinglist",
      }),
    });

    if (!response.ok) {
      logger.warn("[PickValidate] Barcode validation request failed:", response.status);
      return buildErrorResult();
    }

    let data: Record<string, unknown>;
    try {
      data = await response.json();
    } catch {
      logger.warn("[PickValidate] Failed to parse barcode validation response");
      return buildErrorResult();
    }

    // Extract return data from response actions
    const responseActions = data.responseActions as Array<{ returnData?: Record<string, unknown> }> | undefined;
    const ret = responseActions?.[0]?.returnData;

    const shipmentLineId = ret?.shipmentLineId as string | null;
    const conversionRate = Number(ret?.conversionRate || 1);
    const scannedBarcode = (ret?.scannedBarcode as string) || barcode;

    if (!shipmentLineId) {
      logger.debug("[PickValidate] No matching shipment line for barcode:", barcode);
      return buildErrorResult();
    }

    // Update the matching line in the grid
    const updatedLines = lines.map((line) => ({ ...line }));
    let matched = false;

    for (const line of updatedLines) {
      const lineId = line.shipmentLineId || line.inOutLineId || line.mInOutLineId || line.lineId || line.id;
      if (lineId === shipmentLineId) {
        const effectiveQty = qty * conversionRate;
        const currentVerified = Number(line.qtyVerified || 0);
        line.qtyVerified = currentVerified + effectiveQty;
        line.qtyPending = Number(line.quantity || 0) - (line.qtyVerified as number);

        if (!Array.isArray(line.scannedInputs)) {
          line.scannedInputs = [];
        }
        (line.scannedInputs as Array<{ code: string; qty: number }>).push({
          code: scannedBarcode,
          qty: effectiveQty,
        });

        matched = true;
        break;
      }
    }

    if (!matched) {
      logger.warn("[PickValidate] shipmentLineId from server not found in grid:", shipmentLineId);
      return buildErrorResult();
    }

    return {
      barcode: "",
      Barcode: "",
      quantity: 1,
      Quantity: 1,
      picking_lines: updatedLines,
    };
  } catch (error) {
    logger.warn("[PickValidate] Error during barcode validation:", error);
    return buildErrorResult();
  }
};

function buildErrorResult(): Record<string, unknown> {
  return {
    barcode: "",
    Barcode: "",
    quantity: 1,
    Quantity: 1,
    _validations: [
      {
        id: "OBWPL_WRONG_BARCODE",
        isValid: false,
        message: "OBWPL_Alert_WrongBarcode",
        severity: "error",
      },
    ],
  };
}
