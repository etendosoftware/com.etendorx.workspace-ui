import {
  DEFAULT_COLUMN_PINNING,
  FIXED_PINNED_COLUMNS,
  getUserPinnedColumns,
  hasUserPinnedColumns,
  isUserColumnReorder,
  withFixedPinnedColumns,
} from "../columnState";

const COLUMN_A = "Document No.";
const COLUMN_B = "Business Partner";

describe("columnState", () => {
  describe("withFixedPinnedColumns", () => {
    it("keeps the fixed columns first on the left, once", () => {
      const result = withFixedPinnedColumns({ left: [COLUMN_A, "actions"], right: ["mrt-row-select", COLUMN_B] });

      expect(result).toEqual({ left: [...FIXED_PINNED_COLUMNS, COLUMN_A], right: [COLUMN_B] });
    });

    it("returns the default pinning for an empty state", () => {
      expect(withFixedPinnedColumns({})).toEqual(DEFAULT_COLUMN_PINNING);
    });
  });

  describe("getUserPinnedColumns", () => {
    it("drops the fixed columns and the empty sides", () => {
      expect(getUserPinnedColumns(DEFAULT_COLUMN_PINNING)).toEqual({});
      expect(getUserPinnedColumns({ left: [...FIXED_PINNED_COLUMNS, COLUMN_A], right: [COLUMN_B] })).toEqual({
        left: [COLUMN_A],
        right: [COLUMN_B],
      });
    });

    it("tells whether the user pinned a column", () => {
      expect(hasUserPinnedColumns(DEFAULT_COLUMN_PINNING)).toBe(false);
      expect(hasUserPinnedColumns({ right: [COLUMN_B] })).toBe(true);
    });
  });

  describe("isUserColumnReorder", () => {
    it.each([
      ["the first order MRT sets", [], [COLUMN_A, COLUMN_B], false],
      ["a change in the number of columns", [COLUMN_A], [COLUMN_A, COLUMN_B], false],
      ["the same order", [COLUMN_A, COLUMN_B], [COLUMN_A, COLUMN_B], false],
      ["a moved column", [COLUMN_A, COLUMN_B], [COLUMN_B, COLUMN_A], true],
    ])("returns the right value for %s", (_label, previous, next, expected) => {
      expect(isUserColumnReorder(previous, next)).toBe(expected);
    });
  });
});
