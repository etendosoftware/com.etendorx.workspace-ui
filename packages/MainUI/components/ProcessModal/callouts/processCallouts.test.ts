import { calculateAddPayment, type GridSelectionStructure } from "./processCallouts";

describe("calculateAddPayment", () => {
  const mockForm = {
    getValues: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should calculate totals correctly from selected records", async () => {
    const formValues = {
      issotrx: true,
      amount_gl_items: 0,
      used_credit: 0,
      generateCredit: 0,
      actual_payment: 0,
    };

    const gridSelection: GridSelectionStructure = {
      order_invoice: {
        _selection: [
          { id: "1", outstandingAmount: 100, amount: 100 },
          { id: "2", outstandingAmount: 50, amount: 50 },
        ] as any[],
        _allRows: [],
      },
    };

    const result = await calculateAddPayment(formValues, mockForm, gridSelection);

    expect(result.expected_payment).toBe("150.00");
    expect(result.amount_inv_ords).toBe("150.00");
    expect(result.total).toBe("150.00");
  });

  it("should auto-fill actual payment logic for Receipt (issotrx=true) when empty", async () => {
    const formValues = {
      issotrx: true,
      amount_gl_items: 0,
      actual_payment: 0, // Empty
    };

    const gridSelection: GridSelectionStructure = {
      order_invoice: {
        _selection: [{ id: "1", outstandingAmount: 100, amount: 100 }] as any[],
        _allRows: [],
      },
    };

    const result = await calculateAddPayment(formValues, mockForm, gridSelection);

    expect(result.actual_payment).toBe("100.00");
    expect(result.difference).toBe("0.00");
  });

  it("should NOT auto-fill actual payment for Receipt (issotrx=true) if partial payment entered", async () => {
    const formValues = {
      issotrx: true,
      amount_gl_items: 0,
      actual_payment: 50, // User entered generic partial amount
    };

    const gridSelection: GridSelectionStructure = {
      order_invoice: {
        _selection: [{ id: "1", outstandingAmount: 100, amount: 100 }] as any[],
        _allRows: [],
      },
    };

    const result = await calculateAddPayment(formValues, mockForm, gridSelection);

    expect(result.actual_payment).toBe("50.00");
    expect(result.difference).toBe("-50.00");
  });

  it("should calculate correctly for Payment Out (issotrx=false) with credit used", async () => {
    const formValues = {
      issotrx: false,
      amount_gl_items: 0,
      used_credit: 20,
      generateCredit: 0,
      actual_payment: 0,
    };

    const gridSelection: GridSelectionStructure = {
      order_invoice: {
        _selection: [{ id: "1", outstandingAmount: 100, amount: 100 }] as any[],
        _allRows: [],
      },
    };

    // Total = 100
    // Payment Out Logic: actPaymentCalc = total + generateCredit = 100
    // usedCredit > 0 (20). 20 < 100 -> actPaymentCalc = 100 - 20 = 80.

    const result = await calculateAddPayment(formValues, mockForm, gridSelection);

    expect(result.total).toBe("100.00");
    expect(result.actual_payment).toBe("80.00");
    // Difference = actual (80) + used (20) - total (100) = 0
    expect(result.difference).toBe("0.00");
  });

  it("should handle GL Items amount properly", async () => {
    const formValues = {
      issotrx: true,
      amount_gl_items: 50,
      actual_payment: 0,
    };

    // No grid selection
    const gridSelection: GridSelectionStructure = {};

    const result = await calculateAddPayment(formValues, mockForm, gridSelection);

    expect(result.amount_inv_ords).toBe("0.00");
    expect(result.total).toBe("50.00");
    expect(result.actual_payment).toBe("50.00");
  });
});
