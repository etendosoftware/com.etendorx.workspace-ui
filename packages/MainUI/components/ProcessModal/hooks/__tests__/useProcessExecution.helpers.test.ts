import { normalizeGridValues } from "@/utils/process/gridNormalization";

describe("normalizeGridValues", () => {
  const makeGrid = (overrides?: object) => ({
    _selection: [{ id: "1" }],
    _allRows: [{ id: "1" }],
    ...overrides,
  });

  it("passes through non-grid values unchanged", () => {
    const input = { amount: 100, name: "test" };
    expect(normalizeGridValues(input)).toEqual({ amount: 100, name: "test" });
  });

  it("adds grid key for the first main grid entry", () => {
    const grid = makeGrid();
    const result = normalizeGridValues({ order_invoice: grid });
    expect(result.grid).toBe(grid);
    expect(result.order_invoice).toBe(grid);
  });

  it("preserves credit_to_use under its original key and does not use it as grid", () => {
    const credit = makeGrid();
    const result = normalizeGridValues({ credit_to_use: credit });
    expect(result.credit_to_use).toBe(credit);
    expect(result.grid).toBeUndefined();
  });

  it("sets grid from main grid and keeps credit_to_use separate", () => {
    const mainGrid = makeGrid();
    const creditGrid = makeGrid({ _selection: [{ id: "c1" }] });
    const result = normalizeGridValues({ order_invoice: mainGrid, credit_to_use: creditGrid });
    expect(result.grid).toBe(mainGrid);
    expect(result.order_invoice).toBe(mainGrid);
    expect(result.credit_to_use).toBe(creditGrid);
  });

  it("uses the first non-credit_to_use grid when multiple grids exist", () => {
    const first = makeGrid();
    const second = makeGrid({ _selection: [{ id: "2" }] });
    const result = normalizeGridValues({ gridA: first, gridB: second });
    expect(result.grid).toBe(first);
  });

  it("returns empty object unchanged", () => {
    expect(normalizeGridValues({})).toEqual({});
  });

  it("does not treat objects missing _allRows as grid entries", () => {
    const notAGrid = { _selection: [{ id: "1" }] };
    const result = normalizeGridValues({ someKey: notAGrid });
    expect(result.grid).toBeUndefined();
  });

  it("does not treat null values as grid entries", () => {
    const result = normalizeGridValues({ someKey: null });
    expect(result.grid).toBeUndefined();
    expect(result.someKey).toBeNull();
  });
});
