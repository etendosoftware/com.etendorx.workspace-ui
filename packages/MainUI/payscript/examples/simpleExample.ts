/**
 * Simple PayScript Engine Usage Example
 *
 * This demonstrates how to use PayScript rules programmatically
 * without React hooks or JSX components.
 */

import { executeLogic } from "../engine/LogicEngine";
import { AddPaymentRulesGeneric } from "../rules/AddPaymentRulesGeneric";

/**
 * Example 1: Basic execution with form values
 */
export function basicExample() {
  const context = {
    actual_payment: 1000,
    issotrx: true,
    received_from: "BP123",
    _gridSelection: {
      invoices: {
        _selection: [
          { id: "INV-001", amount: 500, outstandingAmount: 500 },
          { id: "INV-002", amount: 300, outstandingAmount: 300 },
        ],
      },
    },
    _processId: "APRM_ADD_PAYMENT",
  };

  const result = executeLogic(AddPaymentRulesGeneric, context);

  if (result.success) {
    console.log("✓ Execution successful");
    console.log("Computed fields:", result.computed);
    console.log("Validations:", result.validations);
  } else {
    console.error("✗ Execution failed:", result.error);
  }

  return result;
}

/**
 * Example 2: Multicurrency scenario
 */
export function multicurrencyExample() {
  const context = {
    actual_payment: 850,
    issotrx: true,
    conversion_rate: 1.2,
    currency_id: "USD",
    currency_to_id: "EUR",
    currency_precision: 2,
    _gridSelection: {
      invoices: {
        _selection: [
          { id: "INV-001", amount: 400, outstandingAmount: 500 },
          { id: "INV-002", amount: 400, outstandingAmount: 300 },
        ],
      },
    },
  };

  const result = executeLogic(AddPaymentRulesGeneric, context);

  console.log("Multicurrency result:", {
    total: result.computed?.total,
    difference: result.computed?.difference,
    expected_payment: result.computed?.expected_payment,
  });

  return result;
}

/**
 * Example 3: Overpayment scenario
 */
export function overpaymentExample() {
  const context = {
    actual_payment: 1000,
    issotrx: true,
    received_from: "BP123",
    _gridSelection: {
      invoices: {
        _selection: [{ id: "INV-001", amount: 500, outstandingAmount: 500 }],
      },
    },
  };

  const result = executeLogic(AddPaymentRulesGeneric, context);

  console.log("Overpayment scenario:", {
    difference: result.computed?.difference,
    overpayment_action: result.computed?.overpayment_action,
  });

  return result;
}

/**
 * Example 4: With GL Items
 */
export function glItemsExample() {
  const context = {
    actual_payment: 1200,
    amount_gl_items: 200,
    issotrx: true,
    _gridSelection: {
      invoices: {
        _selection: [
          { id: "INV-001", amount: 500, outstandingAmount: 500 },
          { id: "INV-002", amount: 500, outstandingAmount: 500 },
        ],
      },
    },
  };

  const result = executeLogic(AddPaymentRulesGeneric, context);

  console.log("GL Items scenario:", {
    total: result.computed?.total,
    amountGLItems: result.computed?._computed?.amountGLItems,
  });

  return result;
}

/**
 * Example 5: With validations
 */
export function validationExample() {
  // Try to create credit without business partner
  const context = {
    actual_payment: 1000,
    issotrx: true,
    overpayment_action: "CR",
    received_from: "", // ← Missing business partner
    _gridSelection: {
      invoices: {
        _selection: [{ id: "INV-001", amount: 500, outstandingAmount: 500 }],
      },
    },
  };

  const result = executeLogic(AddPaymentRulesGeneric, context);

  console.log("Validation errors:", result.validations);

  return result;
}

// Run all examples
export function runAllExamples() {
  console.log("\n=== PayScript Engine Examples ===\n");

  console.log("1. Basic Example");
  basicExample();

  console.log("\n2. Multicurrency Example");
  multicurrencyExample();

  console.log("\n3. Overpayment Example");
  overpaymentExample();

  console.log("\n4. GL Items Example");
  glItemsExample();

  console.log("\n5. Validation Example");
  validationExample();

  console.log("\n=== All examples completed ===\n");
}

// Uncomment to run examples
// runAllExamples();
