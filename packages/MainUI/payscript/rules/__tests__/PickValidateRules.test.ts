import { PickValidateRules } from "../PickValidateRules";
import BigNumber from "bignumber.js";

const createMockUtil = (contextOverride = {}) => {
  const context: Record<string, unknown> = {
    ...contextOverride,
  };

  return {
    num: (val: unknown) => new BigNumber(Number(val) || 0),
    valNum: (...keys: string[]) => {
      for (const key of keys) {
        if (context[key] !== undefined) return Number(context[key]) || 0;
      }
      return 0;
    },
    valStr: (...keys: string[]) => {
      for (const key of keys) {
        if (context[key] !== undefined) return String(context[key]);
      }
      return "";
    },
    valBool: (...keys: string[]) => {
      for (const key of keys) {
        if (context[key] !== undefined) return Boolean(context[key]);
      }
      return false;
    },
    val: (...keys: string[]) => {
      for (const key of keys) {
        if (context[key] !== undefined) return context[key];
      }
      return undefined;
    },
    getGridItems: (fields: string[], gridNames: string[]) => {
      for (const name of gridNames) {
        if (context[name]) {
          return (context[name] as Record<string, unknown>[]).map((item) => {
            const copy = { ...item };
            for (const field of fields) {
              if (copy[field] !== undefined) {
                copy[field] = Number(copy[field]) || 0;
              }
            }
            return copy;
          });
        }
      }
      return [];
    },
    sum: (items: Record<string, unknown>[], field: string) => {
      return items.reduce((acc, item) => acc.plus(new BigNumber(Number(item[field]) || 0)), new BigNumber(0));
    },
    distributeAmount: (items: Record<string, unknown>[]) => items,
    convert: (amount: unknown, rate: unknown) => new BigNumber(Number(amount) || 0).times(Number(rate) || 1),
    BigNumber,
  };
};

describe("PickValidateRules", () => {
  describe("compute", () => {
    it("should calculate qtyPending for each line", () => {
      const lines = [
        { id: "1", quantity: 10, qtyVerified: 3 },
        { id: "2", quantity: 5, qtyVerified: 0 },
        { id: "3", quantity: 8, qtyVerified: 8 },
      ];
      const util = createMockUtil({ picking_lines: lines });

      const result = PickValidateRules.compute({}, util);

      expect(result.picking_lines).toHaveLength(3);
      expect(result.picking_lines[0].qtyPending).toBe(7);
      expect(result.picking_lines[1].qtyPending).toBe(5);
      expect(result.picking_lines[2].qtyPending).toBe(0);
    });

    it("should handle empty grid", () => {
      const util = createMockUtil({ picking_lines: [] });
      const result = PickValidateRules.compute({}, util);
      expect(result.picking_lines).toHaveLength(0);
    });

    it("should handle missing qtyVerified as 0", () => {
      const lines = [{ id: "1", quantity: 10 }];
      const util = createMockUtil({ picking_lines: lines });

      const result = PickValidateRules.compute({}, util);
      expect(result.picking_lines[0].qtyPending).toBe(10);
    });

    it("should handle negative qtyPending (over-verified)", () => {
      const lines = [{ id: "1", quantity: 5, qtyVerified: 8 }];
      const util = createMockUtil({ picking_lines: lines });

      const result = PickValidateRules.compute({}, util);
      expect(result.picking_lines[0].qtyPending).toBe(-3);
    });
  });

  describe("validate", () => {
    it("should return no errors when all lines are properly scanned", () => {
      const computed = {
        picking_lines: [
          { id: "1", quantity: 10, qtyVerified: 10 },
          { id: "2", quantity: 5, qtyVerified: 3 },
        ],
      };
      const util = createMockUtil();

      const validations = PickValidateRules.validate({}, computed, util);
      expect(validations).toHaveLength(0);
    });

    it("should return error when a line exceeds quantity", () => {
      const computed = {
        picking_lines: [
          { id: "1", quantity: 10, qtyVerified: 12 },
          { id: "2", quantity: 5, qtyVerified: 3 },
        ],
      };
      const util = createMockUtil();

      const validations = PickValidateRules.validate({}, computed, util);
      expect(validations).toHaveLength(1);
      expect(validations[0].id).toBe("OBWPL_OVER_LIMIT");
      expect(validations[0].severity).toBe("error");
    });

    it("should return error when no lines have been scanned", () => {
      const computed = {
        picking_lines: [
          { id: "1", quantity: 10, qtyVerified: 0 },
          { id: "2", quantity: 5, qtyVerified: 0 },
        ],
      };
      const util = createMockUtil();

      const validations = PickValidateRules.validate({}, computed, util);
      expect(validations).toHaveLength(1);
      expect(validations[0].id).toBe("OBWPL_NO_SCANNED");
    });

    it("should return both errors when over-limit and some unscanned", () => {
      const computed = {
        picking_lines: [{ id: "1", quantity: 5, qtyVerified: 8 }],
      };
      const util = createMockUtil();

      const validations = PickValidateRules.validate({}, computed, util);
      expect(validations).toHaveLength(1);
      expect(validations[0].id).toBe("OBWPL_OVER_LIMIT");
    });

    it("should return no errors for empty grid", () => {
      const computed = { picking_lines: [] };
      const util = createMockUtil();

      const validations = PickValidateRules.validate({}, computed, util);
      expect(validations).toHaveLength(0);
    });

    it("should handle missing qtyVerified as 0", () => {
      const computed = {
        picking_lines: [{ id: "1", quantity: 10 }],
      };
      const util = createMockUtil();

      const validations = PickValidateRules.validate({}, computed, util);
      expect(validations).toHaveLength(1);
      expect(validations[0].id).toBe("OBWPL_NO_SCANNED");
    });
  });
});
