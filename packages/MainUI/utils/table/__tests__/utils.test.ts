import {
  getNewActiveLevels,
  getNewActiveTabsByLevel,
  getCellTitle,
  mapSummariesToBackend,
  getDisplayColumnDefOptions,
  getCurrentRowCanExpand,
} from "../utils";

describe("getNewActiveLevels", () => {
  it("returns [level] when expand is true", () => {
    expect(getNewActiveLevels([0, 1], 2, true)).toEqual([2]);
  });

  it("returns [0] when level is 0", () => {
    expect(getNewActiveLevels([0, 1], 0)).toEqual([0]);
  });

  it("returns currentLevels when maxLevel equals level", () => {
    expect(getNewActiveLevels([0, 2], 2)).toEqual([0, 2]);
  });

  it("returns [level-1, level] when maxLevel > level", () => {
    expect(getNewActiveLevels([0, 3], 1)).toEqual([0, 1]);
  });

  it("returns [maxLevel, level] when maxLevel < level", () => {
    expect(getNewActiveLevels([0, 1], 3)).toEqual([1, 3]);
  });
});

describe("getNewActiveTabsByLevel", () => {
  it("adds a new level-to-tab mapping", () => {
    const map = new Map([[0, "tab0"]]);
    const result = getNewActiveTabsByLevel(map, 1, "tab1");
    expect(result.get(0)).toBe("tab0");
    expect(result.get(1)).toBe("tab1");
  });

  it("overwrites an existing level mapping", () => {
    const map = new Map([[0, "tab0"]]);
    const result = getNewActiveTabsByLevel(map, 0, "newTab");
    expect(result.get(0)).toBe("newTab");
  });

  it("returns a new map instance (immutable)", () => {
    const map = new Map([[0, "tab0"]]);
    const result = getNewActiveTabsByLevel(map, 1, "tab1");
    expect(result).not.toBe(map);
  });

  it("works with an empty map", () => {
    const result = getNewActiveTabsByLevel(new Map(), 0, "tab0");
    expect(result.get(0)).toBe("tab0");
  });
});

describe("getCellTitle", () => {
  it("returns string values directly", () => {
    expect(getCellTitle("hello")).toBe("hello");
  });

  it("converts number to string", () => {
    expect(getCellTitle(42)).toBe("42");
  });

  it("returns empty string for null", () => {
    expect(getCellTitle(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(getCellTitle(undefined)).toBe("");
  });

  it("returns empty string for objects without props", () => {
    expect(getCellTitle({})).toBe("");
  });

  it("returns label from object with props.label", () => {
    const cellValue = { props: { label: "My Label" } };
    expect(getCellTitle(cellValue)).toBe("My Label");
  });

  it("returns empty string for objects with empty props", () => {
    const cellValue = { props: {} };
    expect(getCellTitle(cellValue)).toBe("");
  });
});

describe("mapSummariesToBackend", () => {
  const baseColumns = [
    { id: "col1", columnName: "column_one" },
    { id: "col2", columnName: "column_two" },
  ] as any[];

  it("maps summaries using columnName", () => {
    const summaries = { column_one: "sum", column_two: "avg" };
    const { summaryRequest, columnMapping } = mapSummariesToBackend(summaries, baseColumns);
    expect(summaryRequest.column_one).toBe("sum");
    expect(summaryRequest.column_two).toBe("avg");
  });

  it("creates column mappings from backend name to input key", () => {
    // When using column id as key in summaries, maps backendName (columnName) -> input key
    const summaries = { col2: "avg" };
    const { columnMapping } = mapSummariesToBackend(summaries, baseColumns);
    // backendName = column_two, mapped to the input key "col2"
    expect(columnMapping.column_two).toBe("col2");
  });

  it("skips columns that are not found", () => {
    const summaries = { nonexistent: "sum" };
    const { summaryRequest } = mapSummariesToBackend(summaries, baseColumns);
    expect(Object.keys(summaryRequest)).toHaveLength(0);
  });

  it("returns empty objects for empty summaries", () => {
    const { summaryRequest, columnMapping } = mapSummariesToBackend({}, baseColumns);
    expect(summaryRequest).toEqual({});
    expect(columnMapping).toEqual({});
  });
});

describe("getDisplayColumnDefOptions", () => {
  it("returns hidden expand column in non-tree mode", () => {
    const result = getDisplayColumnDefOptions({ shouldUseTreeMode: false });
    expect(result["mrt-row-expand"].size).toBe(0);
  });

  it("returns visible expand column in tree mode", () => {
    const result = getDisplayColumnDefOptions({ shouldUseTreeMode: true });
    expect(result["mrt-row-expand"].size).toBe(60);
  });

  it("always returns mrt-row-select with size 60", () => {
    expect(getDisplayColumnDefOptions({ shouldUseTreeMode: false })["mrt-row-select"].size).toBe(60);
    expect(getDisplayColumnDefOptions({ shouldUseTreeMode: true })["mrt-row-select"].size).toBe(60);
  });
});

describe("getCurrentRowCanExpand", () => {
  it("returns true in tree mode", () => {
    const row = { original: { showDropIcon: false, __isParent: false } } as any;
    expect(getCurrentRowCanExpand({ shouldUseTreeMode: true, row })).toBe(true);
  });

  it("returns false when showDropIcon is false in non-tree mode", () => {
    const row = { original: { showDropIcon: false } } as any;
    expect(getCurrentRowCanExpand({ shouldUseTreeMode: false, row })).toBe(false);
  });

  it("returns true when showDropIcon is true and is parent in non-tree mode", () => {
    const row = { original: { showDropIcon: true, __isParent: true } } as any;
    expect(getCurrentRowCanExpand({ shouldUseTreeMode: false, row })).toBe(true);
  });

  it("returns false when showDropIcon is true but __isParent is false", () => {
    const row = { original: { showDropIcon: true, __isParent: false } } as any;
    expect(getCurrentRowCanExpand({ shouldUseTreeMode: false, row })).toBe(false);
  });
});
