import { mapBy } from "../structures";

describe("mapBy", () => {
  it("maps an array of objects by a given key", () => {
    const items = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Beta" },
      { id: "c", name: "Gamma" },
    ];

    const result = mapBy(items, "id");

    expect(result).toEqual({
      a: { id: "a", name: "Alpha" },
      b: { id: "b", name: "Beta" },
      c: { id: "c", name: "Gamma" },
    });
  });

  it("returns an empty object for an empty array", () => {
    expect(mapBy([], "id")).toEqual({});
  });

  it("maps by a numeric key field", () => {
    const items = [
      { code: "X1", value: 10 },
      { code: "X2", value: 20 },
    ];

    const result = mapBy(items, "code");
    expect(result["X1"]).toEqual({ code: "X1", value: 10 });
    expect(result["X2"]).toEqual({ code: "X2", value: 20 });
  });

  it("overwrites earlier entries if duplicate keys exist", () => {
    const items = [
      { id: "dup", name: "First" },
      { id: "dup", name: "Second" },
    ];

    const result = mapBy(items, "id");
    expect(result["dup"].name).toBe("Second");
  });

  it("preserves the full object reference in the result", () => {
    const item = { id: "ref", extra: { nested: true } };
    const result = mapBy([item], "id");
    expect(result["ref"]).toBe(item);
  });
});
