import { dateSortingFn, dateTimeSortingFn } from "../sortingFunctions";

type DateValue = string | number | Date | null | undefined;

/** Helper to build a minimal MRT row mock */
const makeRow = (value: DateValue) => ({
  getValue: (_columnId: string) => value,
});

const COL = "date";

describe("dateTimeSortingFn", () => {
  describe("null / undefined handling", () => {
    it("returns 0 when both values are null", () => {
      expect(dateTimeSortingFn(makeRow(null) as never, makeRow(null) as never, COL)).toBe(0);
    });

    it("returns 0 when both values are undefined", () => {
      expect(dateTimeSortingFn(makeRow(undefined) as never, makeRow(undefined) as never, COL)).toBe(0);
    });

    it("returns 1 (A after B) when A is null and B is a valid date", () => {
      expect(dateTimeSortingFn(makeRow(null) as never, makeRow("2023-01-01") as never, COL)).toBe(1);
    });

    it("returns -1 (A before B) when B is null and A is a valid date", () => {
      expect(dateTimeSortingFn(makeRow("2023-01-01") as never, makeRow(null) as never, COL)).toBe(-1);
    });
  });

  describe("invalid date handling", () => {
    it("returns 0 when both values produce invalid dates", () => {
      expect(dateTimeSortingFn(makeRow("not-a-date") as never, makeRow("also-not-a-date") as never, COL)).toBe(0);
    });

    it("returns 1 when A is invalid and B is valid", () => {
      expect(dateTimeSortingFn(makeRow("not-a-date") as never, makeRow("2023-06-15") as never, COL)).toBe(1);
    });

    it("returns -1 when B is invalid and A is valid", () => {
      expect(dateTimeSortingFn(makeRow("2023-06-15") as never, makeRow("not-a-date") as never, COL)).toBe(-1);
    });
  });

  describe("valid date comparison", () => {
    it("returns a negative number when A is earlier than B", () => {
      const result = dateTimeSortingFn(
        makeRow("2023-01-01T00:00:00") as never,
        makeRow("2023-12-31T23:59:59") as never,
        COL
      );
      expect(result).toBeLessThan(0);
    });

    it("returns a positive number when A is later than B", () => {
      const result = dateTimeSortingFn(
        makeRow("2023-12-31T23:59:59") as never,
        makeRow("2023-01-01T00:00:00") as never,
        COL
      );
      expect(result).toBeGreaterThan(0);
    });

    it("returns 0 when both dates are identical", () => {
      expect(
        dateTimeSortingFn(makeRow("2023-06-15T12:00:00") as never, makeRow("2023-06-15T12:00:00") as never, COL)
      ).toBe(0);
    });

    it("distinguishes dates on the same day by time", () => {
      const result = dateTimeSortingFn(
        makeRow("2023-06-15T08:00:00") as never,
        makeRow("2023-06-15T20:00:00") as never,
        COL
      );
      expect(result).toBeLessThan(0);
    });

    it("works with numeric timestamps", () => {
      const earlier = new Date("2020-01-01").getTime();
      const later = new Date("2021-01-01").getTime();
      expect(dateTimeSortingFn(makeRow(earlier) as never, makeRow(later) as never, COL)).toBeLessThan(0);
    });

    it("works with Date objects", () => {
      expect(
        dateTimeSortingFn(makeRow(new Date("2022-03-01")) as never, makeRow(new Date("2022-03-02")) as never, COL)
      ).toBeLessThan(0);
    });
  });
});

describe("dateSortingFn", () => {
  describe("null / undefined handling", () => {
    it("returns 0 when both values are null", () => {
      expect(dateSortingFn(makeRow(null) as never, makeRow(null) as never, COL)).toBe(0);
    });

    it("returns 1 when A is null and B is a valid date", () => {
      expect(dateSortingFn(makeRow(null) as never, makeRow("2023-01-01") as never, COL)).toBe(1);
    });

    it("returns -1 when B is null and A is a valid date", () => {
      expect(dateSortingFn(makeRow("2023-01-01") as never, makeRow(null) as never, COL)).toBe(-1);
    });
  });

  describe("invalid date handling", () => {
    it("returns 0 when both produce invalid dates", () => {
      expect(dateSortingFn(makeRow("bad") as never, makeRow("bad") as never, COL)).toBe(0);
    });

    it("returns 1 when A is invalid and B is valid", () => {
      expect(dateSortingFn(makeRow("bad") as never, makeRow("2023-06-15") as never, COL)).toBe(1);
    });

    it("returns -1 when B is invalid and A is valid", () => {
      expect(dateSortingFn(makeRow("2023-06-15") as never, makeRow("bad") as never, COL)).toBe(-1);
    });
  });

  describe("valid date comparison (date-only)", () => {
    it("returns a negative number when A is earlier than B", () => {
      expect(dateSortingFn(makeRow("2023-01-01") as never, makeRow("2023-12-31") as never, COL)).toBeLessThan(0);
    });

    it("returns a positive number when A is later than B", () => {
      expect(dateSortingFn(makeRow("2023-12-31") as never, makeRow("2023-01-01") as never, COL)).toBeGreaterThan(0);
    });

    it("returns 0 for the same date regardless of time component", () => {
      expect(dateSortingFn(makeRow("2023-06-15T00:00:00") as never, makeRow("2023-06-15T23:59:59") as never, COL)).toBe(
        0
      );
    });

    it("returns 0 when both dates are identical", () => {
      expect(dateSortingFn(makeRow("2023-06-15") as never, makeRow("2023-06-15") as never, COL)).toBe(0);
    });
  });
});
