import { computeFieldLayout } from "../computeFieldLayout";
import type { Field } from "@workspaceui/api-client/src/api/types";

function makeField(overrides: Partial<Field>): Field {
  return {
    id: "f1",
    hqlName: "field1",
    startnewline: false,
    startinoddcolumn: false,
    obuiappColspan: null,
    obuiappRowspan: null,
    displayOnSameLine: false,
    column: {} as any,
    sequenceNumber: 10,
    displayed: true,
    ...overrides,
  } as Field;
}

describe("computeFieldLayout", () => {
  it("returns empty map for empty input", () => {
    expect(computeFieldLayout([])).toEqual(new Map());
  });

  it("returns no entries for plain fields (no layout metadata)", () => {
    const fields = [makeField({ id: "a" }), makeField({ id: "b" }), makeField({ id: "c" })];
    expect(computeFieldLayout(fields).size).toBe(0);
  });

  it("sets colStart=1 for a field with startnewline=true", () => {
    const fields = [makeField({ id: "a" }), makeField({ id: "b", startnewline: true })];
    expect(computeFieldLayout(fields).get("b")).toEqual({ colStart: 1 });
  });

  it("first field with startnewline is still colStart=1", () => {
    expect(computeFieldLayout([makeField({ id: "a", startnewline: true })]).get("a")).toEqual({ colStart: 1 });
  });

  it("startinoddcolumn on cursor=1 (already odd): no entry", () => {
    expect(computeFieldLayout([makeField({ id: "a", startinoddcolumn: true })]).get("a")).toBeUndefined();
  });

  it("startinoddcolumn on cursor=2 (even): sets colStart=3", () => {
    const fields = [makeField({ id: "a" }), makeField({ id: "b", startinoddcolumn: true })];
    expect(computeFieldLayout(fields).get("b")).toEqual({ colStart: 3 });
  });

  it("startinoddcolumn on cursor=3 (already odd): no entry", () => {
    const fields = [makeField({ id: "a" }), makeField({ id: "b" }), makeField({ id: "c", startinoddcolumn: true })];
    expect(computeFieldLayout(fields).get("c")).toBeUndefined();
  });

  it("cursor wraps to 1 after filling 3 columns", () => {
    const fields = [
      makeField({ id: "a" }), makeField({ id: "b" }), makeField({ id: "c" }),
      makeField({ id: "d", startinoddcolumn: true }),
    ];
    expect(computeFieldLayout(fields).get("d")).toBeUndefined();
  });

  it("colspan is accounted for in cursor advancement", () => {
    const fields = [makeField({ id: "a", obuiappColspan: 2 }), makeField({ id: "b", startinoddcolumn: true })];
    expect(computeFieldLayout(fields).get("b")).toBeUndefined();
  });

  it("startnewline resets cursor; startinoddcolumn on cursor=3 needs no override", () => {
    const fields = [
      makeField({ id: "a" }),
      makeField({ id: "b", startnewline: true }),
      makeField({ id: "c" }),
      makeField({ id: "d", startinoddcolumn: true }),
    ];
    const result = computeFieldLayout(fields);
    expect(result.get("b")).toEqual({ colStart: 1 });
    expect(result.get("d")).toBeUndefined();
  });

  it("startnewline followed by startinoddcolumn on even cursor gets colStart=3", () => {
    const fields = [
      makeField({ id: "a" }),
      makeField({ id: "b", startnewline: true }),
      makeField({ id: "c", startinoddcolumn: true }),
    ];
    const result = computeFieldLayout(fields);
    expect(result.get("b")).toEqual({ colStart: 1 });
    expect(result.get("c")).toEqual({ colStart: 3 });
  });
});
