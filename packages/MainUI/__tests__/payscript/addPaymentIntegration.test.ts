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

    // GL Items grid scenarios. The grid has `obuiappShowSelect=false`, so the rows
    // the user adds live in `gridSelection["glitem"]._allRows`, never in `_selection`.
    // The script must read them via `getAllGridRows` (replaces classic
    // OB.APRM.AddPayment.updateGLItemsTotal that wrote `amount_gl_items` in the form).
    describe("GL Items grid (glitem._allRows)", () => {
      const glitemSelection = (rows: any[]): GridSelectionStructure => ({
        glitem: { _selection: [] as any[], _allRows: rows as any[] },
      });

      it("Receipt + Paid Out > 0: sum is negative, overpayment action appears", async () => {
        // Reproduces the original bug: paid_out=50 with no invoice and no actual payment
        // should make difference > 0 (we are "receiving" -50 of GL items, total = -50,
        // difference = 0 - (-50) = 50) and trigger the display logic.
        const result = await genericPayScriptCallout(
          { _processId: TEST_PROCESS_ID, actual_payment: 0, issotrx: true },
          mockForm,
          glitemSelection([{ id: "row-1", received_in: 0, paid_out: 50 }])
        );

        expect(result.amount_gl_items).toBe("-50.00");
        expect(result.total).toBe("-50.00");
        expect(result.difference).toBe("50.00");
        expect(result.overpayment_action_display_logic).toBe("Y");
        expect(result.overpayment_action).toBe("CR");
      });

      it("Payment-out + Paid Out > 0: sum positive, no overpayment action", async () => {
        const result = await genericPayScriptCallout(
          { _processId: TEST_PROCESS_ID, actual_payment: 0, issotrx: false },
          mockForm,
          glitemSelection([{ id: "row-1", received_in: 0, paid_out: 50 }])
        );

        expect(result.amount_gl_items).toBe("50.00");
        expect(result.total).toBe("50.00");
        expect(result.difference).toBe("-50.00");
        expect(result.overpayment_action_display_logic).toBe("N");
        expect(result.overpayment_action).toBe("");
      });

      it("sums multiple GL Item rows in receipt direction", async () => {
        const result = await genericPayScriptCallout(
          { _processId: TEST_PROCESS_ID, actual_payment: 0, issotrx: true },
          mockForm,
          glitemSelection([
            { id: "a", received_in: 100, paid_out: 0 },
            { id: "b", received_in: 0, paid_out: 40 },
            { id: "c", received_in: 25, paid_out: 0 },
          ])
        );

        // 100 - 0 + 0 - 40 + 25 - 0 = 85
        expect(result.amount_gl_items).toBe("85.00");
      });

      it("combines GL Items with selected invoices", async () => {
        const gridSelection: GridSelectionStructure = {
          order_invoice: {
            _selection: [{ id: "inv1", outstandingAmount: 200, amount: 200 }] as any[],
            _allRows: [],
          },
          glitem: {
            _selection: [] as any[],
            _allRows: [{ id: "row-1", received_in: 0, paid_out: 30 }] as any[],
          },
        };

        const result = await genericPayScriptCallout(
          { _processId: TEST_PROCESS_ID, actual_payment: 200, issotrx: true },
          mockForm,
          gridSelection
        );

        expect(result.amount_inv_ords).toBe("200.00");
        expect(result.amount_gl_items).toBe("-30.00");
        // total = 200 + (-30) = 170; difference = 200 - 170 = 30
        expect(result.total).toBe("170.00");
        expect(result.difference).toBe("30.00");
        expect(result.overpayment_action_display_logic).toBe("Y");
      });

      it("accepts HQL key shapes (receivedIn / paidOut) like DB shapes", async () => {
        const result = await genericPayScriptCallout(
          { _processId: TEST_PROCESS_ID, actual_payment: 0, issotrx: true },
          mockForm,
          glitemSelection([{ id: "row-1", receivedIn: 10, paidOut: 4 }])
        );

        expect(result.amount_gl_items).toBe("6.00");
      });

      it("empty _allRows yields zero contribution", async () => {
        const result = await genericPayScriptCallout(
          { _processId: TEST_PROCESS_ID, actual_payment: 0, issotrx: true },
          mockForm,
          glitemSelection([])
        );

        expect(result.amount_gl_items).toBe("0.00");
        expect(result.total).toBe("0.00");
        expect(result.difference).toBe("0.00");
        expect(result.overpayment_action_display_logic).toBe("N");
      });

      it("RCIN trxtype is treated as receipt for GL Items sign", async () => {
        const result = await genericPayScriptCallout(
          { _processId: TEST_PROCESS_ID, actual_payment: 0, issotrx: false, trxtype: "RCIN" },
          mockForm,
          glitemSelection([{ id: "row-1", received_in: 0, paid_out: 50 }])
        );

        // Same as the SOTrx case because RCIN forces isSOTrx=true.
        expect(result.amount_gl_items).toBe("-50.00");
      });
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
