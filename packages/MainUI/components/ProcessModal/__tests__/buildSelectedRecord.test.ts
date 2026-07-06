import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { buildSelectedRecord, computeScalarStableKey } from "../WindowReferenceGrid";

describe("computeScalarStableKey", () => {
  it("returns an empty string for null/undefined input", () => {
    expect(computeScalarStableKey(null)).toBe("");
    expect(computeScalarStableKey(undefined)).toBe("");
  });

  it("returns an empty string for an empty object", () => {
    expect(computeScalarStableKey({})).toBe("");
  });

  it("includes scalar entries (string, number, boolean) in the key", () => {
    const key = computeScalarStableKey({ a: "x", b: 1, c: true });
    expect(key).toContain("a:x");
    expect(key).toContain("b:1");
    expect(key).toContain("c:true");
  });

  it("excludes null and undefined entries", () => {
    const key = computeScalarStableKey({ a: 1, b: null, c: undefined });
    expect(key).toContain("a:1");
    expect(key).not.toContain("b:");
    expect(key).not.toContain("c:");
  });

  it("excludes object and array entries (only stabilizes scalars)", () => {
    const key = computeScalarStableKey({ a: 1, b: { nested: true }, c: [1, 2, 3] });
    expect(key).toContain("a:1");
    expect(key).not.toContain("b:");
    expect(key).not.toContain("c:");
  });

  it("produces the same key for two objects with identical scalar contents but different references", () => {
    expect(computeScalarStableKey({ a: 1, b: "x" })).toBe(computeScalarStableKey({ a: 1, b: "x" }));
  });

  it("produces a different key when any scalar value changes", () => {
    expect(computeScalarStableKey({ a: 1 })).not.toBe(computeScalarStableKey({ a: 2 }));
  });

  it("produces a different key when a scalar key is added", () => {
    expect(computeScalarStableKey({ a: 1 })).not.toBe(computeScalarStableKey({ a: 1, b: 2 }));
  });

  it("is stable across re-renders when only nested object identity changes", () => {
    // Real scenario: parent re-renders pass a fresh `{ nested }` object even
    // though the scalars are unchanged. The key must remain identical so
    // downstream useMemo doesn't invalidate.
    const before = computeScalarStableKey({ scalar: "x", nested: { a: 1 } });
    const after = computeScalarStableKey({ scalar: "x", nested: { a: 1 } });
    expect(before).toBe(after);
  });
});

describe("buildSelectedRecord", () => {
  it("preserves a non-zero payment over expectedAmount", () => {
    const record = { id: "1", payment: 50, expectedAmount: 100 } as EntityData;
    const result = buildSelectedRecord(record);
    expect(result.payment).toBe(50);
    expect(result.obSelected).toBe(true);
  });

  it("falls back to expectedAmount when payment is 0", () => {
    const record = { id: "1", payment: 0, expectedAmount: 100 } as EntityData;
    const result = buildSelectedRecord(record);
    expect(result.payment).toBe(100);
    expect(result.obSelected).toBe(true);
  });

  it("falls back to expectedAmount when payment is undefined", () => {
    const record = { id: "1", expectedAmount: 100 } as EntityData;
    const result = buildSelectedRecord(record);
    expect(result.payment).toBe(100);
    expect(result.obSelected).toBe(true);
  });

  it("falls back to outstanding when expectedAmount is missing", () => {
    const record = { id: "1", payment: 0, outstanding: 80 } as EntityData;
    const result = buildSelectedRecord(record);
    expect(result.payment).toBe(80);
    expect(result.obSelected).toBe(true);
  });

  it("defaults to 0 when nothing is provided", () => {
    const record = { id: "1", payment: 0 } as EntityData;
    const result = buildSelectedRecord(record);
    expect(result.payment).toBe(0);
    expect(result.obSelected).toBe(true);
  });

  it("returns the same reference when already selected with matching payment (no-op)", () => {
    const record = { id: "1", obSelected: true, payment: 100, expectedAmount: 100 } as EntityData;
    expect(buildSelectedRecord(record)).toBe(record);
  });

  it("returns a new object when obSelected is false but payment already matches default", () => {
    const record = { id: "1", obSelected: false, payment: 100, expectedAmount: 100 } as EntityData;
    const result = buildSelectedRecord(record);
    expect(result).not.toBe(record);
    expect(result.obSelected).toBe(true);
    expect(result.payment).toBe(100);
  });

  it("returns a new object when obSelected is true but payment must change", () => {
    const record = { id: "1", obSelected: true, payment: 0, expectedAmount: 100 } as EntityData;
    const result = buildSelectedRecord(record);
    expect(result).not.toBe(record);
    expect(result.payment).toBe(100);
  });

  it("treats null payment like undefined and falls back", () => {
    const record = { id: "1", payment: null, expectedAmount: 42 } as EntityData;
    const result = buildSelectedRecord(record);
    expect(result.payment).toBe(42);
  });

  it("does not mutate the input record", () => {
    const record = { id: "1", obSelected: false, payment: 0, expectedAmount: 100 } as EntityData;
    const snapshot = { ...record };
    buildSelectedRecord(record);
    expect(record).toEqual(snapshot);
  });
});
