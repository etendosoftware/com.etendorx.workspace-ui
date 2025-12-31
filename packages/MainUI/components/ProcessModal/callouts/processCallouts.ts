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
import { ADD_PAYMENT_ORDER_PROCESS_ID } from "@/utils/processes/definition/constants";

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
export const PROCESS_CALLOUTS: ProcessCalloutsConfig = {
  // Callout for aprm_orderinvoice entity - Sum outstandingAmount to expected_payment
  [ADD_PAYMENT_ORDER_PROCESS_ID]: [
    {
      triggerField: "_internalGridSelectionTrigger",
      execute: (v, f, g) => calculateAddPayment(v, f, g, "_internalGridSelectionTrigger"),
    },
    {
      triggerField: "actual_payment",
      execute: (v, f, g) => calculateAddPayment(v, f, g, "actual_payment"),
    },
    {
      triggerField: "amount_gl_items",
      execute: (v, f, g) => calculateAddPayment(v, f, g, "amount_gl_items"),
    },
    {
      triggerField: "used_credit",
      execute: (v, f, g) => calculateAddPayment(v, f, g, "used_credit"),
    },
    {
      triggerField: "generateCredit",
      execute: (v, f, g) => calculateAddPayment(v, f, g, "generateCredit"),
    },
  ],
};

/**
 * Main calculation logic for Add Payment process
 */
async function calculateAddPayment(
  _formValues: Record<string, unknown>,
  _form: any,
  gridSelection?: GridSelectionStructure,
  triggerField?: string
): Promise<Record<string, unknown>> {
  // Helper to get number from string/number safely
  const getNum = (val: unknown): number => {
    if (typeof val === "number") return val;
    if (typeof val === "string") return Number.parseFloat(val.replace(/,/g, "")) || 0;
    return 0;
  };

  // Improved boolean detection for issotrx
  const getBool = (val: unknown): boolean => {
    if (typeof val === "boolean") return val;
    if (val === "true" || val === "Y" || val === "y") return true;
    return false;
  };

  // Extract form values
  // Check 'issotrx', 'isSOTrx', and 'inpissotrx'
  let issotrx = getBool(_formValues.issotrx) || getBool(_formValues.isSOTrx) || getBool(_formValues.inpissotrx);

  // If not explicitly true, check trxtype for 'RCIN' (Receipt) default
  const trxtype = _formValues.trxtype as string;
  if (!issotrx && trxtype === "RCIN") {
    issotrx = true;
  }

  // Helper to extract value checking multiple keys
  const getValue = (keys: string[]): unknown => {
    // 1. Prioritize _formValues passed to the function (contains pending changes)
    for (const key of keys) {
      if (_formValues[key] !== undefined) return _formValues[key];
    }

    // 2. Fallback to form instance if available
    if (_form && typeof _form.getValues === "function") {
      for (const key of keys) {
        const val = _form.getValues(key);
        if (val !== undefined) return val;
      }
    }
    return undefined;
  };

  const glItemsTotal = getNum(getValue(["amount_gl_items", "amountGlItems", "AmountGlItems"]));
  const usedCredit = getNum(getValue(["used_credit", "usedCredit", "UsedCredit"]));

  // Read Actual Payment from multiple possible keys
  const actualPaymentRaw = getValue(["actual_payment", "actualPayment", "ActualPayment", "inpactual_payment"]);
  let actualPayment = getNum(actualPaymentRaw);

  const generateCredit = getNum(getValue(["generateCredit", "generate_credit", "GenerateCredit"]));

  // Get all selected records from aprm_orderinvoice grid
  const selectedRecords = Object.values(gridSelection || {}).flatMap((selection) => selection._selection || []);

  // Calculate totals from selected records
  let totalOutstanding = 0;
  let totalAmountInvOrds = 0;

  selectedRecords.forEach((record) => {
    if (!record) return; // Skip if record is undefined
    const outstanding = getNum(record.outstandingAmount);
    const rawAmount = record.amount;

    let amount = 0;
    if (rawAmount !== undefined && rawAmount !== null) {
      amount = getNum(rawAmount);
    }

    // Logic: Default 'amount' to 'outstanding' if it's 0/missing on selection
    if (amount === 0 && outstanding !== 0) {
      amount = outstanding;
    }

    totalOutstanding += outstanding;
    totalAmountInvOrds += amount;
  });

  // 1. Calculate Expected Payment
  const expectedPayment = totalOutstanding;

  // 2. Calculate Amount Inv/Ords
  const amountInvOrds = totalAmountInvOrds;

  // 3. Calculate Total
  const total = amountInvOrds + glItemsTotal;

  // 4. Calculate Actual Payment
  if (!issotrx) {
    // Payment Out: Auto-calculate Actual Payment to match Total (minus credit)
    let actPaymentCalc = total + generateCredit;

    if (usedCredit > 0) {
      if (usedCredit >= actPaymentCalc) {
        actPaymentCalc = 0;
      } else {
        actPaymentCalc = actPaymentCalc - usedCredit;
      }
    }
    actualPayment = actPaymentCalc;
  } else {
    // Payment In (Receipt)

    // Only auto-fill if currently empty/zero.
    // This respects any manual values entered by the user (persisting them even on deselect).
    if (actualPayment === 0 && total > 0) {
      actualPayment = total;
    }
  }

  // 5. Calculate Differences
  // Use helper to ensure precision 2 before diff
  const differenceVal = actualPayment + usedCredit - total;
  // Round to 2 decimals to avoid floating point artifacts (e.g. -1.13e-13)
  const difference = Math.round(differenceVal * 100) / 100;

  // Expected Difference
  // Legacy Logic: If expectedDiffAmt (GL/Line level check) is 0,
  // set Expected Difference to the actual Difference (Visual fallback).
  const expectedDifferenceVal = expectedPayment + usedCredit - amountInvOrds;
  let expectedDifference = Math.round(expectedDifferenceVal * 100) / 100;

  if (expectedDifference === 0) {
    expectedDifference = difference;
  }

  // Formatting helpers
  const fmt = (n: number) => n.toFixed(2);

  console.debug("Callout Calc:", { issotrx, total, actualPayment, difference, expectedDifference });

  const updates: Record<string, string | number | null> = {
    // Expected Payment
    expected_payment: fmt(expectedPayment),
    Expected_Payment: fmt(expectedPayment),
    expectedPayment: fmt(expectedPayment),
    "Expected Payment": fmt(expectedPayment),

    // Amount Inv Ords
    amount_inv_ords: fmt(amountInvOrds),
    amountInvOrds: fmt(amountInvOrds),
    AmountInvOrds: fmt(amountInvOrds),
    "Amount on Invoices and/or Orders": fmt(amountInvOrds),

    // Total
    total: fmt(total),
    Total: fmt(total),
    TOTAL: fmt(total),

    // Actual Payment
    actual_payment: fmt(actualPayment),
    actualPayment: fmt(actualPayment),
    ActualPayment: fmt(actualPayment),
    "Actual Payment": fmt(actualPayment),

    // Difference
    difference: fmt(difference),
    Difference: fmt(difference),

    // Expected Difference (Provide multiple casing options as fallback)
    expectedDifference: fmt(expectedDifference),
    ExpectedDifference: fmt(expectedDifference),
    expected_difference: fmt(expectedDifference),
    "There is a difference of": fmt(expectedDifference),

    // Overpayment Action Logic
    // We set a default action if there is a POSITIVE difference (Overpayment).
    // Underpayment (difference < 0) does not require overpayment action.
    overpayment_action: difference > 0 ? "CR" : "",
    overpayment_action_display_logic: difference > 0 ? "Y" : "N",
  };

  return updates;
}

/**
 * Get callouts for a specific process
 */
export function getProcessCallouts(processId: string): ProcessCallout[] {
  return PROCESS_CALLOUTS[processId] || [];
}
