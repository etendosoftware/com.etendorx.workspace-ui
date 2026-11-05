import { getRowToSaveOnRowClick, shouldSaveOnRowBlur } from "../utils/rowLeave";

describe("getRowToSaveOnRowClick", () => {
  const dirty = (ids: string[]) => (rowId: string) => ids.includes(rowId);

  it("saves the edited row when another row is clicked", () => {
    expect(getRowToSaveOnRowClick("2", ["1"], dirty(["1"]))).toBe("1");
  });

  it("does not save when the edited row has no pending changes", () => {
    expect(getRowToSaveOnRowClick("2", ["1"], dirty([]))).toBeNull();
  });

  it("does not save when the clicked row is the one being edited", () => {
    expect(getRowToSaveOnRowClick("1", ["1"], dirty(["1"]))).toBeNull();
  });

  it("does nothing when no row is being edited", () => {
    expect(getRowToSaveOnRowClick("2", [], dirty([]))).toBeNull();
  });
});

describe("shouldSaveOnRowBlur", () => {
  it("saves an existing row with pending changes", () => {
    expect(shouldSaveOnRowBlur(false, true)).toBe(true);
  });

  it("keeps an existing row without changes untouched", () => {
    expect(shouldSaveOnRowBlur(false, false)).toBe(false);
  });

  it("always saves a new row", () => {
    expect(shouldSaveOnRowBlur(true, false)).toBe(true);
  });
});
