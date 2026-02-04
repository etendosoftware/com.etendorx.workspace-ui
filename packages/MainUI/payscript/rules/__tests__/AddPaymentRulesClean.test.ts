import { AddPaymentRulesGeneric } from "../AddPaymentRulesClean";
import BigNumber from "bignumber.js";

const ACTUAL_PAYMENT_KEY = "actual_payment";
const ORDER_INVOICE_KEY = "order_invoice";
const TOTAL_KEY = "total";

// Mock implementation of UI Utils provided to the rule
const createMockUtil = (contextOverride = {}) => {
  const context = {
    [ACTUAL_PAYMENT_KEY]: 100,
    amount_inv_ords: 0,
    amount_gl_items: 0,
    used_credit: 0,
    // Add default values as needed...
    ...contextOverride,
  };

  return {
    num: (val) => new BigNumber(val || 0),
    valNum: (key, alias1, alias2) => {
      const val = context[key] ?? context[alias1] ?? context[alias2];
      return val !== undefined ? val : 0;
    },
    valStr: (key, alias1, alias2) => {
      return context[key] ?? context[alias1] ?? context[alias2];
    },
    getGridItems: (fields, gridNames) => {
      // For testing, we can put grid items in context under gridName key
      for (const name of gridNames) {
        if (context[name]) return context[name];
      }
      return [];
    },
    sum: (items, field) => {
      return items.reduce((acc, item) => acc.plus(new BigNumber(item[field] || 0)), new BigNumber(0));
    },
    distributeAmount: (items, totalToDistribute) => {
      // Simple mock distribution: pay fully in order until runs out
      let remaining = totalToDistribute;
      items.forEach((item) => {
        const outstanding = new BigNumber(item.outstandingAmount || 0);
        if (remaining.gt(0)) {
          if (remaining.gte(outstanding)) {
            item.amount = outstanding.toNumber();
            remaining = remaining.minus(outstanding);
          } else {
            item.amount = remaining.toNumber();
            remaining = new BigNumber(0);
          }
        } else {
          item.amount = 0;
        }
      });
    },
    convert: (amount, rate) => {
      return new BigNumber(amount).times(rate);
    },
  };
};

describe("AddPaymentRulesGeneric", () => {
  describe("compute", () => {
    it("should calculate expected payment correctly", () => {
      const invoices = [
        { id: "1", outstandingAmount: 50, amount: 0 },
        { id: "2", outstandingAmount: 50, amount: 0 },
      ];
      const util = createMockUtil({
        [ORDER_INVOICE_KEY]: invoices,
        [ACTUAL_PAYMENT_KEY]: 100,
      });

      const result = AddPaymentRulesGeneric.compute({}, util);

      // totalOutstanding = 100
      expect(result.expectedPayment).toBe("100.00");
      expect(result.difference).toBe("0.00");
    });

    it("should handle underpayment difference", () => {
      const invoices = [{ id: "1", outstandingAmount: 100, amount: 0 }];
      const util = createMockUtil({
        [ORDER_INVOICE_KEY]: invoices,
        [ACTUAL_PAYMENT_KEY]: 80,
      });

      const result = AddPaymentRulesGeneric.compute({}, util);

      // Actual 80 - Total Expected 100 = -20 (difference in payment vs outstanding)
      // But 'difference' logic in rule is actual - allocated = 0 (fully allocated)
      // 'expectedDifference' logic is outstanding - allocated = 20 remaining
      expect(result.difference).toBe("0.00");
      expect(result.expectedDifference).toBe("20.00");
    });

    it("should handle used credit", () => {
      const invoices = [{ id: "1", outstandingAmount: 100, amount: 0 }];
      const creditItems = [{ id: "c1", paymentAmount: 20, outstandingAmount: 20 }];

      const util = createMockUtil({
        [ORDER_INVOICE_KEY]: invoices,
        credit_to_use: creditItems,
        [ACTUAL_PAYMENT_KEY]: 80,
      });

      const result = AddPaymentRulesGeneric.compute({}, util);

      // Used Credit = 20
      // Total Paid = 80 (actual) + 20 (credit) = 100
      // Expected = 100
      // Difference = 0
      expect(result.usedCredit).toBe("20.00");
      expect(result.difference).toBe("0.00");
    });
  });

  describe("validate", () => {
    it("should return error if overpayment without business partner", () => {
      const util = createMockUtil({
        [ACTUAL_PAYMENT_KEY]: 150,
        overpayment_action: "CR", // Action set
        // received_from is undefined/null
      });

      const computed = {
        _computed: { hasReceivedFrom: false },
        [TOTAL_KEY]: 100,
        usedCredit: 0,
      };

      const validations = AddPaymentRulesGeneric.validate({}, computed, util);

      expect(validations).toHaveLength(1);
      expect(validations[0].id).toBe("APRM_CREDIT_NO_BPARTNER");
    });

    it("should return error if allocated amount exceeds actual + credit", () => {
      const util = createMockUtil({
        [ACTUAL_PAYMENT_KEY]: 100,
      });

      const computed = {
        [TOTAL_KEY]: 120, // Allocated 120, but only paid 100
        _computed: { usedCredit: 0 },
      };

      const validations = AddPaymentRulesGeneric.validate({}, computed, util);
      expect(validations).toHaveLength(1);
      expect(validations[0].id).toBe("APRM_MORE_ALLOCATED");
    });

    it("should return error if invoice amount exceeds outstanding", () => {
      const util = createMockUtil({});
      const invoices = [
        { id: "1", amount: 60, outstandingAmount: 50 }, // Paying 60 on 50 debt
      ];

      const computed = {
        [TOTAL_KEY]: 60,
        [ORDER_INVOICE_KEY]: invoices,
        _computed: {},
      };

      const validations = AddPaymentRulesGeneric.validate({}, computed, util);
      expect(validations).toHaveLength(1);
      expect(validations[0].id).toBe("AMOUNT_EXCEEDS_OUTSTANDING");
    });
  });
});
