import { sameRecord, sameRecords } from "../sameRecords";

describe("sameRecord", () => {
  it("is true for the same object or the same values", () => {
    const record = { id: "1", name: "A" };
    expect(sameRecord(record, record)).toBe(true);
    expect(sameRecord({ id: "1", name: "A" }, { id: "1", name: "A" })).toBe(true);
  });

  it("is false when a value or the set of keys differs", () => {
    expect(sameRecord({ id: "1", name: "A" }, { id: "1", name: "B" })).toBe(false);
    expect(sameRecord({ id: "1" }, { id: "1", name: "A" })).toBe(false);
  });

  it("compares nested values by reference", () => {
    const entries = [{ id: "x" }];
    expect(sameRecord({ id: "1", entries }, { id: "1", entries })).toBe(true);
    expect(sameRecord({ id: "1", entries }, { id: "1", entries: [{ id: "x" }] })).toBe(false);
  });

  it("is false when only one of them is missing", () => {
    expect(sameRecord(undefined, { id: "1" })).toBe(false);
    expect(sameRecord()).toBe(true);
  });
});

describe("sameRecords", () => {
  it("is true for lists with the same records in the same order", () => {
    expect(sameRecords([{ id: "1" }, { id: "2" }], [{ id: "1" }, { id: "2" }])).toBe(true);
  });

  it("is false when the length, the order or a record differs", () => {
    expect(sameRecords([{ id: "1" }], [])).toBe(false);
    expect(sameRecords([{ id: "1" }, { id: "2" }], [{ id: "2" }, { id: "1" }])).toBe(false);
    expect(sameRecords([{ id: "1", a: 1 }], [{ id: "1", a: 2 }])).toBe(false);
  });
});
