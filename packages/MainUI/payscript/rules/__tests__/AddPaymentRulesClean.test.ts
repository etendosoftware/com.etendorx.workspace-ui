import { AddPaymentRulesGeneric } from "../AddPaymentRulesClean";

describe("AddPaymentRulesClean", () => {
  let mockUtil;

  const createMockNum = (val: any) => {
    const numericVal = val && val.val !== undefined ? val.val : Number(val || 0);
    return {
      val: numericVal,
      plus: (n: any) => createMockNum(numericVal + (n && n.val !== undefined ? n.val : Number(n || 0))),
      minus: (n: any) => createMockNum(numericVal - (n && n.val !== undefined ? n.val : Number(n || 0))),
      abs: () => createMockNum(Math.abs(numericVal)),
      eq: (n: any) => numericVal === (n && n.val !== undefined ? n.val : Number(n || 0)),
      gt: (n: any) => numericVal > (n && n.val !== undefined ? n.val : Number(n || 0)),
      lt: (n: any) => numericVal < (n && n.val !== undefined ? n.val : Number(n || 0)),
      toNumber: () => numericVal,
      toFixed: (p: number) => numericVal.toFixed(p),
    };
  };

  beforeEach(() => {
    mockUtil = {
      num: jest.fn((v) => createMockNum(v)),
      valNum: jest.fn(),
      valStr: jest.fn(),
      getGridItems: jest.fn(),
      sum: jest.fn(),
      distributeAmount: jest.fn(),
      convert: jest.fn((v, r) => createMockNum(Number(v || 0) * Number(r || 1))),
    };
  });

  describe("compute", () => {
    it("calculates values correctly without credit items", () => {
      mockUtil.valNum.mockImplementation((key) => {
        if (key === "actual_payment") return 100;
        if (key === "currency_precision") return 2;
        return 0;
      });
      mockUtil.getGridItems.mockReturnValue([]);
      mockUtil.sum.mockReturnValue(createMockNum(0));

      const result = AddPaymentRulesGeneric.compute({}, mockUtil);

      expect(result.total).toBe("0.00");
      expect(result.difference).toBe("100.00");
      expect(result.used_credit).toBe("0.00");
    });

    it("calculates correctly with credit items", () => {
      mockUtil.valNum.mockImplementation((key) => {
        if (key === "actual_payment") return 100;
        return 0;
      });
      const creditItems = [
        { paymentAmount: 10, outstandingAmount: 10 },
        { paymentAmount: 20, outstandingAmount: 20 },
      ];
      mockUtil.getGridItems.mockImplementation((_cols, types) => {
        if (types.includes("credit_to_use")) return creditItems;
        if (types.includes("order_invoice")) return [];
        return [];
      });
      mockUtil.sum.mockImplementation((items, col) => {
        if (col === "paymentAmount") return createMockNum(30);
        return createMockNum(0);
      });

      const result = AddPaymentRulesGeneric.compute({}, mockUtil);

      expect(result.used_credit).toBe("30.00");
      expect(result.difference).toBe("130.00");
    });

    it("handles multi-currency conversion", () => {
      mockUtil.valNum.mockImplementation((key) => {
        if (key === "actual_payment") return 100;
        if (key === "conversion_rate") return 1.5;
        if (key === "currency_precision") return 2;
        return 0;
      });
      mockUtil.valStr.mockImplementation((key) => {
        if (key === "currency_id") return "USD";
        if (key === "currency_to_id") return "EUR";
        return "";
      });
      mockUtil.getGridItems.mockReturnValue([]);
      mockUtil.sum.mockReturnValue(createMockNum(0));
      mockUtil.convert.mockReturnValue(createMockNum(150));

      AddPaymentRulesGeneric.compute({}, mockUtil);

      expect(mockUtil.convert).toHaveBeenCalledWith(100, 1.5, 1, 2);
    });
  });

  describe("validate", () => {
    it("returns error if overpayment action without bpartner", () => {
      mockUtil.valNum.mockReturnValue(100);
      mockUtil.valStr.mockImplementation((key) => {
        if (key === "overpayment_action") return "CR";
        return "";
      });

      const computed = {
        total: "50.00",
        used_credit: "0.00",
        _computed: {
          hasReceivedFrom: false,
          usedCredit: 0,
        },
      };

      const result = AddPaymentRulesGeneric.validate({}, computed, mockUtil);

      expect(result).toContainEqual(
        expect.objectContaining({
          id: "APRM_CREDIT_NO_BPARTNER",
          severity: "error",
        })
      );
    });

    it("returns error if total allocated exceeds actual payment + credit", () => {
      mockUtil.valNum.mockReturnValue(100);
      const computed = {
        total: "150.00",
        _computed: {
          usedCredit: 20,
        },
      };

      const result = AddPaymentRulesGeneric.validate({}, computed, mockUtil);

      expect(result).toContainEqual(
        expect.objectContaining({
          id: "APRM_MORE_ALLOCATED",
        })
      );
    });

    it("returns error if invoice amount exceeds outstanding", () => {
      mockUtil.valNum.mockReturnValue(100);
      const computed = {
        total: "100.00",
        order_invoice: [{ id: "inv1", amount: 60, outstandingAmount: 50 }],
        _computed: {
          usedCredit: 0,
        },
      };

      const result = AddPaymentRulesGeneric.validate({}, computed, mockUtil);

      expect(result).toContainEqual(
        expect.objectContaining({
          id: "AMOUNT_EXCEEDS_OUTSTANDING",
          context: { id: "inv1" },
        })
      );
    });
  });
});
