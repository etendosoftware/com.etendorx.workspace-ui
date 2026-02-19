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

import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { UseFormReturn } from "react-hook-form";
import { ADD_PAYMENT_ORDER_PROCESS_ID, PICK_VALIDATE_PROCESS_ID } from "@/utils/processes/definition/constants";
import { genericPayScriptCallout, registerPayScriptRules } from "./genericPayScriptCallout";
import { pickValidateBarcodeCallout } from "./pickValidateBarcodeCallout";
import { PickValidateRules } from "@/payscript/rules/PickValidateRules";

export const FUNDS_TRANSFER_PROCESS_ID = "CC73C4845CDC487395804946EACB225F";

// Register PayScript rules for Pick & Validate process (static registration)
registerPayScriptRules(PICK_VALIDATE_PROCESS_ID, PickValidateRules);

/**
 * Grid selection structure type
 */
export type GridSelectionStructure = {
  [entityName: string]: {
    _selection: EntityData[];
    _allRows: EntityData[];
  };
};

/**
 * Callout function type
 * Takes the current form values, form instance, and selected grid records
 * Returns updates to be applied to the form
 */
export type ProcessCalloutFunction = (
  formValues: Record<string, unknown>,
  form: UseFormReturn<Record<string, unknown>>,
  gridSelection?: GridSelectionStructure
) => Record<string, unknown> | Promise<Record<string, unknown>>;

/**
 * Callout configuration for a specific process
 */
export interface ProcessCallout {
  /** The field that triggers this callout */
  triggerField: string;
  /** The callout function to execute */
  execute: ProcessCalloutFunction;
}

/**
 * Process callouts configuration
 * Maps processId to array of callouts for that process
 */
export type ProcessCalloutsConfig = Record<string, ProcessCallout[]>;

/**
 * Process callouts registry
 * Add your process-specific callouts here
 *
 * Example:
 * ```typescript
 * "your-process-id": [
 *   {
 *     triggerField: "parameterName",
 *     execute: async (formValues, form, gridSelection) => {
 *       // Your callout logic here
 *       return {
 *         targetField: calculatedValue
 *       };
 *     }
 *   }
 * ]
 * ```
 */
// Helper to create generic PayScript callout config
const createPayScriptCallout = (triggerField: string): ProcessCallout => ({
  triggerField,
  execute: genericPayScriptCallout,
});

export const PROCESS_CALLOUTS: ProcessCalloutsConfig = {
  // Generic PayScript-based callout for Add Payment process
  // No process-specific adapter needed - rules are registered above
  [ADD_PAYMENT_ORDER_PROCESS_ID]: [
    createPayScriptCallout("_internalGridSelectionTrigger"),
    createPayScriptCallout("actual_payment"),
    createPayScriptCallout("amount_gl_items"),
    createPayScriptCallout("used_credit"),
    createPayScriptCallout("generateCredit"),
  ],
  // Pick & Validate process: barcode triggers async server validation,
  // grid changes trigger PayScript recalculation of qtyPending
  [PICK_VALIDATE_PROCESS_ID]: [
    { triggerField: "barcode", execute: pickValidateBarcodeCallout },
    createPayScriptCallout("_internalGridSelectionTrigger"),
    createPayScriptCallout("quantity"),
  ],
};

/**
 * ============================================================================
 * LEGACY CODE - DEPRECATED
 * ============================================================================
 * The following code is the old imperative implementation of Add Payment logic.
 * It has been replaced by the PayScript declarative engine (see addPaymentPayScript.ts).
 * This code is kept for reference and backwards compatibility testing only.
 * DO NOT USE FOR NEW IMPLEMENTATIONS.
 * ============================================================================
 */

/**
 * @deprecated Use PayScript-based addPaymentPayScriptCallout instead
 * Main calculation logic for Add Payment process (LEGACY)
 */
// Helper functions (extracted to module scope)

const getNum = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number.parseFloat(val.replace(/,/g, "")) || 0;
  return 0;
};

const getBool = (val: unknown): boolean => {
  if (typeof val === "boolean") return val;
  if (val === "true" || val === "Y" || val === "y") return true;
  return false;
};

const calculateRecordTotals = (selectedRecords: any[]) => {
  let totalOutstanding = 0;
  let totalAmountInvOrds = 0;

  for (const record of selectedRecords) {
    if (!record) continue;
    const outstanding = getNum(record.outstandingAmount);
    const rawAmount = record.amount;

    let amount = 0;
    if (rawAmount !== undefined && rawAmount !== null) {
      amount = getNum(rawAmount);
    }

    if (amount === 0 && outstanding !== 0) {
      amount = outstanding;
    }

    totalOutstanding += outstanding;
    totalAmountInvOrds += amount;
  }

  return { totalOutstanding, totalAmountInvOrds };
};

const calculateRefinedActualPayment = (
  issotrx: boolean,
  total: number,
  generateCredit: number,
  usedCredit: number,
  currentActualPayment: number
): number => {
  let actualPayment = currentActualPayment;

  if (!issotrx) {
    // Payment Out: Auto-calculate Actual Payment to match Total (minus credit)
    let actPaymentCalc = total + generateCredit;

    if (usedCredit > 0) {
      actPaymentCalc = usedCredit >= actPaymentCalc ? 0 : actPaymentCalc - usedCredit;
    }
    actualPayment = actPaymentCalc;
  } else {
    // Payment In (Receipt)
    // Only auto-fill if currently empty/zero.
    if (actualPayment === 0 && total > 0) {
      actualPayment = total;
    }
  }
  return actualPayment;
};

/**
 * @deprecated Use addPaymentPayScriptCallout instead
 * Main calculation logic for Add Payment process (LEGACY)
 */
export async function calculateAddPayment(
  _formValues: Record<string, unknown>,
  _form: any,
  gridSelection?: GridSelectionStructure,
  triggerField?: string
): Promise<Record<string, unknown>> {
  // Internal helper for this specific scope's value retrieval priority
  const getValue = (keys: string[]): unknown => {
    for (const key of keys) {
      if (_formValues[key] !== undefined) return _formValues[key];
    }
    if (_form && typeof _form.getValues === "function") {
      for (const key of keys) {
        const val = _form.getValues(key);
        if (val !== undefined) return val;
      }
    }
    return undefined;
  };

  // Extract basic values
  let issotrx = getBool(_formValues.issotrx) || getBool(_formValues.isSOTrx) || getBool(_formValues.inpissotrx);
  const trxtype = _formValues.trxtype as string;
  // Default to Receipt if RCIN and not set
  if (!issotrx && trxtype === "RCIN") {
    issotrx = true;
  }

  const glItemsTotal = getNum(getValue(["amount_gl_items", "amountGlItems", "AmountGlItems"]));
  const usedCredit = getNum(getValue(["used_credit", "usedCredit", "UsedCredit"]));
  const generateCredit = getNum(getValue(["generateCredit", "generate_credit", "GenerateCredit"]));
  const currentActualPayment = getNum(
    getValue(["actual_payment", "actualPayment", "ActualPayment", "inpactual_payment"])
  );

  // Grid calculations
  const selectedRecords = Object.values(gridSelection || {}).flatMap((selection) => selection._selection || []);
  const { totalOutstanding, totalAmountInvOrds } = calculateRecordTotals(selectedRecords);

  // Derived values
  const expectedPayment = totalOutstanding;
  const amountInvOrds = totalAmountInvOrds;
  const total = amountInvOrds + glItemsTotal;

  // Actual Payment Calculation
  const actualPayment = calculateRefinedActualPayment(issotrx, total, generateCredit, usedCredit, currentActualPayment);

  // Differences
  const differenceVal = actualPayment + usedCredit - total;
  const difference = Math.round(differenceVal * 100) / 100;

  const expectedDifferenceVal = expectedPayment + usedCredit - amountInvOrds;
  let expectedDifference = Math.round(expectedDifferenceVal * 100) / 100;

  if (expectedDifference === 0) {
    expectedDifference = difference;
  }

  // Formatting
  const fmt = (n: number) => n.toFixed(2);

  return {
    expected_payment: fmt(expectedPayment),
    Expected_Payment: fmt(expectedPayment),
    expectedPayment: fmt(expectedPayment),
    "Expected Payment": fmt(expectedPayment),

    amount_inv_ords: fmt(amountInvOrds),
    amountInvOrds: fmt(amountInvOrds),
    AmountInvOrds: fmt(amountInvOrds),
    "Amount on Invoices and/or Orders": fmt(amountInvOrds),

    total: fmt(total),
    Total: fmt(total),
    TOTAL: fmt(total),

    actual_payment: fmt(actualPayment),
    actualPayment: fmt(actualPayment),
    ActualPayment: fmt(actualPayment),
    "Actual Payment": fmt(actualPayment),

    difference: fmt(difference),
    Difference: fmt(difference),

    expectedDifference: fmt(expectedDifference),
    ExpectedDifference: fmt(expectedDifference),
    expected_difference: fmt(expectedDifference),
    "There is a difference of": fmt(expectedDifference),

    overpayment_action: difference > 0 ? "CR" : "",
    overpayment_action_display_logic: difference > 0 ? "Y" : "N",
  };
}

/**
 * Get callouts for a specific process
 */
export function getProcessCallouts(processId: string): ProcessCallout[] {
  return PROCESS_CALLOUTS[processId] || [];
}
