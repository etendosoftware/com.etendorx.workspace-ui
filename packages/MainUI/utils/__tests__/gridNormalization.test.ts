import { normalizeGridValues } from "../process/gridNormalization";

describe("normalizeGridValues", () => {
  it("should return a copy of the input when no grid entries exist", () => {
    const input = { foo: "bar", num: 42 };
    const result = normalizeGridValues(input);
    expect(result).toEqual({ foo: "bar", num: 42 });
    expect(result).not.toBe(input);
  });

  it("should expose the first grid entry under the 'grid' key", () => {
    const gridValue = { _selection: [{ id: "id1" }], _allRows: [{ id: "id1" }] };
    const result = normalizeGridValues({ myGrid: gridValue, other: "val" });
    expect(result.grid).toEqual(gridValue);
    expect(result.myGrid).toEqual(gridValue);
    expect(result.other).toBe("val");
  });

  it("should skip credit_to_use entries", () => {
    const creditGrid = { _selection: [{ id: "id1" }], _allRows: [{ id: "id1" }] };
    const result = normalizeGridValues({ credit_to_use: creditGrid });
    expect(result.grid).toBeUndefined();
    expect(result.credit_to_use).toEqual(creditGrid);
  });

  it("should only take the first non-credit grid entry when multiple exist", () => {
    const grid1 = { _selection: [{ id: "a" }], _allRows: [{ id: "a" }] };
    const grid2 = { _selection: [{ id: "b" }], _allRows: [{ id: "b" }] };
    const result = normalizeGridValues({ g1: grid1, g2: grid2 });
    expect(result.grid).toEqual(grid1);
  });

  it("should not treat objects without _selection and _allRows as grid entries", () => {
    const result = normalizeGridValues({ obj: { _selection: [{ id: "x" }] }, plain: "text" });
    expect(result.grid).toBeUndefined();
  });

  it("should handle null and undefined values without error", () => {
    const result = normalizeGridValues({ a: null, b: undefined });
    expect(result).toEqual({ a: null, b: undefined });
  });

  describe("row sanitization", () => {
    it("strips _locallyAdded and the client-only id from rows added via '+'", () => {
      const grid = {
        _selection: [],
        _allRows: [{ id: "0F2E3B53298643389A89B4DB4A11C772", _locallyAdded: true, gLItem: "GL_A", receivedIn: 1 }],
      };
      const result = normalizeGridValues({ glitem: grid });
      expect(result.glitem).toEqual({
        _selection: [],
        _allRows: [{ gLItem: "GL_A", receivedIn: 1 }],
      });
    });

    it("preserves the id on rows that are not locally added", () => {
      const grid = {
        _selection: [{ id: "real-id", gLItem: "GL_X" }],
        _allRows: [{ id: "real-id", gLItem: "GL_X" }],
      };
      const result = normalizeGridValues({ order_invoice: grid });
      expect(result.order_invoice).toEqual({
        _selection: [{ id: "real-id", gLItem: "GL_X" }],
        _allRows: [{ id: "real-id", gLItem: "GL_X" }],
      });
    });

    it("strips _locallyAdded even when it is the only sanitization needed", () => {
      const grid = {
        _selection: [],
        _allRows: [{ id: "kept-id", _locallyAdded: false, gLItem: "GL_K" }],
      };
      const result = normalizeGridValues({ glitem: grid });
      expect(result.glitem).toEqual({
        _selection: [],
        _allRows: [{ id: "kept-id", gLItem: "GL_K" }],
      });
    });

    it("applies sanitization to both _selection and _allRows", () => {
      const localRow = { id: "uuid", _locallyAdded: true, paidOut: 5 };
      const grid = { _selection: [localRow], _allRows: [localRow] };
      const result = normalizeGridValues({ glitem: grid });
      const expectedRow = { paidOut: 5 };
      expect(result.glitem).toEqual({ _selection: [expectedRow], _allRows: [expectedRow] });
    });

    it("leaves non-grid keys untouched", () => {
      const result = normalizeGridValues({
        scalar: 42,
        flag: true,
        nested: { foo: "bar" },
      });
      expect(result).toEqual({ scalar: 42, flag: true, nested: { foo: "bar" } });
    });

    it("does not mutate the input row objects", () => {
      const localRow = { id: "uuid", _locallyAdded: true, gLItem: "GL_M" };
      const grid = { _selection: [], _allRows: [localRow] };
      normalizeGridValues({ glitem: grid });
      expect(localRow).toEqual({ id: "uuid", _locallyAdded: true, gLItem: "GL_M" });
    });
  });
});
