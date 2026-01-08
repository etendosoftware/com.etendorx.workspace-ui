import * as fs from "fs";
import * as path from "path";
import { describe, expect, it, beforeAll } from "@jest/globals";
import {
  genericPayScriptCallout,
  registerPayScriptDSL,
} from "../../components/ProcessModal/callouts/genericPayScriptCallout";
import type { GridSelectionStructure } from "../../components/ProcessModal/callouts/processCallouts";

const TEST_PROCESS_ID = "800166"; // Add Payment process ID

describe("Add Payment PayScript Integration", () => {
  const mockForm = {
    getValues: () => ({}),
    setValue: () => {},
  } as any;

  beforeAll(() => {
    // Read the Clean JS Rules file as a string (simulating DB retrieval)
    // We navigate from __tests__/payscript/ to payscript/rules/
    const rulesPath = path.join(__dirname, "../../payscript/rules/AddPaymentRulesClean.js");
    const dslContent = fs.readFileSync(rulesPath, "utf-8");

    // Register using the DSL parser
    registerPayScriptDSL(TEST_PROCESS_ID, dslContent);
  });

  describe("genericPayScriptCallout with AddPaymentRules", () => {
    it("should calculate totals correctly from selected invoices", async () => {
      const formValues = {
        actual_payment: 1000,
        issotrx: true,
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [
            { id: "1", outstandingAmount: 500, amount: 500 },
            { id: "2", outstandingAmount: 300, amount: 300 },
          ] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      expect(result.expected_payment).toBe("800.00");
      expect(result.amount_inv_ords).toBe("800.00");
      expect(result.total).toBe("800.00");
      expect(result.difference).toBe("200.00");
    });

    it("should handle multicurrency scenarios", async () => {
      const formValues = {
        actual_payment: 1000,
        issotrx: true,
        currency_id: "USD",
        currencyToId: "EUR",
        conversionRate: 0.85,
        currencyPrecision: 2,
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      expect(result.expected_payment).toBe("0.00");
      expect(result.difference).toBe("1000.00");
    });

    it("should calculate expected payment from outstanding amounts", async () => {
      const formValues = {
        actual_payment: 1000,
        issotrx: true,
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [
            { id: "1", outstandingAmount: 600, amount: 600 },
            { id: "2", outstandingAmount: 300, amount: 300 },
            { id: "3", outstandingAmount: 200, amount: 100 },
          ] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      // Expected payment should be sum of outstanding: 600 + 300 + 200 = 1100
      expect(result.expected_payment).toBe("1100.00");
      // Total should be sum of amounts: 600 + 300 + 100 = 1000
      expect(result.total).toBe("1000.00");
      // No overpayment since actual = total
      expect(result.difference).toBe("0.00");
    });

    it("should handle used credit correctly", async () => {
      const formValues = {
        actual_payment: 1000,
        used_credit: 150,
        issotrx: true,
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [{ id: "1", outstandingAmount: 500, amount: 500 }] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      // 1000 + 150 - 500 = 650
      expect(result.difference).toBe("650.00");
    });

    it("should set overpayment action when difference is positive", async () => {
      const formValues = {
        actual_payment: 1000,
        issotrx: true,
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [{ id: "1", outstandingAmount: 500, amount: 500 }] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      expect(result.difference).toBe("500.00");
      expect(result.overpayment_action).toBe("CR");
      expect(result.overpayment_action_display_logic).toBe("Y");
    });

    it("should NOT set overpayment action when difference is zero or negative", async () => {
      const formValues = {
        actual_payment: 500,
        issotrx: true,
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [{ id: "1", outstandingAmount: 500, amount: 500 }] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      expect(result.difference).toBe("0.00");
      expect(result.overpayment_action).toBe("");
      expect(result.overpayment_action_display_logic).toBe("N");
    });

    it("should handle transaction type RCIN correctly", async () => {
      const formValues = {
        actual_payment: 1000,
        issotrx: false,
        trxtype: "RCIN",
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      // Should default to Receipt (isSOTrx = true) for RCIN
      expect(result.difference).toBe("1000.00");
    });

    it("should handle multiple field naming conventions", async () => {
      const formValues = {
        actualPayment: 1000, // camelCase naming convention
        isSOTrx: true, // PascalCase naming convention
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [{ id: "1", outstandingAmount: 500, amount: 500 }] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      // Engine auto-detects field names and returns with 'inp' prefix
      expect(result.expected_payment).toBe("500.00");
      expect(result.total).toBe("500.00");
      expect(result.difference).toBe("500.00");
    });

    it("should handle empty grid selection", async () => {
      const formValues = {
        actual_payment: 1000,
        issotrx: true,
      };

      const result = await genericPayScriptCallout({ ...formValues, _processId: TEST_PROCESS_ID }, mockForm, undefined);

      expect(result.expected_payment).toBe("0.00");
      expect(result.total).toBe("0.00");
      expect(result.difference).toBe("1000.00");
    });

    it("should handle zero actual payment", async () => {
      const formValues = {
        actual_payment: 0,
        issotrx: true,
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [{ id: "1", outstandingAmount: 500, amount: 500 }] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      expect(result.difference).toBe("-500.00");
    });
  });

  describe("PayScript vs Legacy Compatibility", () => {
    it("should produce same results as legacy implementation for basic case", async () => {
      const formValues = {
        actual_payment: 1000,
        issotrx: true,
        amount_gl_items: 0,
        used_credit: 0,
        generateCredit: 0,
      };

      const gridSelection: GridSelectionStructure = {
        order_invoice: {
          _selection: [
            { id: "1", outstandingAmount: 500, amount: 500 },
            { id: "2", outstandingAmount: 300, amount: 300 },
          ] as any[],
          _allRows: [],
        },
      };

      const result = await genericPayScriptCallout(
        { ...formValues, _processId: TEST_PROCESS_ID },
        mockForm,
        gridSelection
      );

      // Expected behavior from legacy implementation
      expect(result.expected_payment).toBe("800.00");
      expect(result.total).toBe("800.00");
      expect(result.difference).toBe("200.00");
      expect(result.overpayment_action).toBe("CR");
    });
  });
});
