import { mapKeysWithDefaults, transformDates } from "@/utils/processes/manual/utils";

describe("transformDates", () => {
  it("converts dd-mm-yyyy string to yyyy-mm-dd", () => {
    expect(transformDates("15-03-2024")).toBe("2024-03-15");
  });

  it("leaves non-date strings unchanged", () => {
    expect(transformDates("hello")).toBe("hello");
    expect(transformDates("2024-03-15")).toBe("2024-03-15");
    expect(transformDates("")).toBe("");
  });

  it("handles non-string primitives", () => {
    expect(transformDates(42)).toBe(42);
    expect(transformDates(true)).toBe(true);
    expect(transformDates(null)).toBe(null);
    expect(transformDates(undefined)).toBe(undefined);
  });

  it("recursively transforms dates inside objects", () => {
    const input = { date: "15-03-2024", name: "test" };
    expect(transformDates(input)).toEqual({ date: "2024-03-15", name: "test" });
  });

  it("recursively transforms dates inside arrays", () => {
    const input = [{ date: "01-01-2020" }, { date: "31-12-2023" }];
    expect(transformDates(input)).toEqual([{ date: "2020-01-01" }, { date: "2023-12-31" }]);
  });
});

describe("mapKeysWithDefaults", () => {
  it("maps known keys to their target names", () => {
    const result = mapKeysWithDefaults({ inpgrandtotal: 100 });
    expect(result).toHaveProperty("actual_payment", 100);
    expect(result).not.toHaveProperty("inpgrandtotal");
  });

  it("converts 'Y' to true and 'N' to false", () => {
    const result = mapKeysWithDefaults({ inpissotrx: "Y" });
    expect(result.issotrx).toBe(true);

    const result2 = mapKeysWithDefaults({ inpissotrx: "N" });
    expect(result2.issotrx).toBe(false);
  });

  it("fills in defaults for unmapped keys", () => {
    const result = mapKeysWithDefaults({});
    expect(result).toHaveProperty("actual_payment", 0);
    expect(result).toHaveProperty("amount_inv_ords", 0);
    expect(result).toHaveProperty("DOCBASETYPE", "ARR");
    expect(result).toHaveProperty("issotrx", false);
  });

  it("replaces empty string value with default", () => {
    const result = mapKeysWithDefaults({ inpgrandtotal: "" });
    expect(result.actual_payment).toBe(0);
  });

  it("passes through unknown keys as-is", () => {
    const result = mapKeysWithDefaults({ custom_field: "value" } as Record<string, unknown>);
    expect(result).toHaveProperty("custom_field", "value");
  });

  it("maps payment_date and handles date format conversion", () => {
    const result = mapKeysWithDefaults({ inpdateacct: "15-03-2024" });
    expect(result.payment_date).toBe("2024-03-15");
  });

  it("maps inpdateacct null to payment_date null", () => {
    const result = mapKeysWithDefaults({ inpdateacct: null });
    expect(result.payment_date).toBeNull();
  });

  it("maps 'Payment Date' to payment_date and converts format", () => {
    const result = mapKeysWithDefaults({ "Payment Date": "15-03-2024" });
    expect(result.payment_date).toBe("2024-03-15");
  });

  it("maps inppaymentdate to payment_date without changing ISO format", () => {
    const result = mapKeysWithDefaults({ inppaymentdate: "2014-07-18" });
    expect(result.payment_date).toBe("2014-07-18");
  });

  it("propagates actual_payment into nested _selection items", () => {
    const result = mapKeysWithDefaults({
      inpgrandtotal: 250,
      nested: {
        _selection: [{ id: "1" }, { id: "2", amount: 25 }],
      },
    } as Record<string, unknown>);

    const nested = result.nested as Record<string, unknown>;
    const selection = nested._selection as Array<Record<string, unknown>>;
    expect(selection[0].amount).toBe(250);
    expect(selection[1].amount).toBe(25);
  });

  it('maps "Actual Payment" to actual_payment', () => {
    const result = mapKeysWithDefaults({ "Actual Payment": "28.92" });
    expect(result.actual_payment).toBe("28.92");
  });

  it("fills selection amount only when missing", () => {
    const result = mapKeysWithDefaults({
      actual_payment: 100,
      nested: {
        _selection: [{ id: "1", amount: 0 }, { id: "2" }],
      },
    } as Record<string, unknown>);

    const nested = result.nested as Record<string, unknown>;
    const selection = nested._selection as Array<Record<string, unknown>>;
    expect(selection[0].amount).toBe(0);
    expect(selection[1].amount).toBe(100);
  });

  it("handles multiple payment document no key variants", () => {
    const result1 = mapKeysWithDefaults({ "Payment Document No": "DOC-001" });
    expect(result1.payment_documentno).toBe("DOC-001");

    const result2 = mapKeysWithDefaults({ "Payment Document No.": "DOC-002" });
    expect(result2.payment_documentno).toBe("DOC-002");
  });

  it("maps converted_amount and conversion_rate to the same target", () => {
    const result = mapKeysWithDefaults({ conversion_rate: 1.5 });
    expect(result.conversion_rate).toBe(1.5);
  });
});
