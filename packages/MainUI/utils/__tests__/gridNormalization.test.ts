import { normalizeGridValues } from "../process/gridNormalization";

describe("normalizeGridValues", () => {
  it("should return a copy of the input when no grid entries exist", () => {
    const input = { foo: "bar", num: 42 };
    const result = normalizeGridValues(input);
    expect(result).toEqual({ foo: "bar", num: 42 });
    expect(result).not.toBe(input);
  });

  it("should set the first grid entry under the 'grid' key", () => {
    const gridValue = { _selection: ["id1"], _allRows: [{ id: "id1" }] };
    const result = normalizeGridValues({ myGrid: gridValue, other: "val" });
    expect(result.grid).toBe(gridValue);
    expect(result.myGrid).toBe(gridValue);
    expect(result.other).toBe("val");
  });

  it("should skip credit_to_use entries", () => {
    const creditGrid = { _selection: ["id1"], _allRows: [{ id: "id1" }] };
    const result = normalizeGridValues({ credit_to_use: creditGrid });
    expect(result.grid).toBeUndefined();
    expect(result.credit_to_use).toBe(creditGrid);
  });

  it("should only take the first grid entry when multiple exist", () => {
    const grid1 = { _selection: ["a"], _allRows: [{ id: "a" }] };
    const grid2 = { _selection: ["b"], _allRows: [{ id: "b" }] };
    const result = normalizeGridValues({ g1: grid1, g2: grid2 });
    expect(result.grid).toBe(grid1);
  });

  it("should not treat objects without _selection and _allRows as grid entries", () => {
    const result = normalizeGridValues({ obj: { _selection: ["x"] }, plain: "text" });
    expect(result.grid).toBeUndefined();
  });

  it("should handle null values without error", () => {
    const result = normalizeGridValues({ a: null, b: undefined });
    expect(result).toEqual({ a: null, b: undefined });
  });
});
