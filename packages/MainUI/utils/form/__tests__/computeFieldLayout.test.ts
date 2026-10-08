import { computeFieldLayout, FORM_GRID_COLUMNS, getEffectiveColspan, isFullWidthField } from "../computeFieldLayout";
import { FIELD_REFERENCE_CODES } from "../constants";
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

const LONG_TEXT_REFERENCE_IDS = [
  FIELD_REFERENCE_CODES.TEXT_LONG.id,
  FIELD_REFERENCE_CODES.MEMO.id,
  FIELD_REFERENCE_CODES.RICH_TEXT.id,
];

function makeTextField(overrides: Partial<Field> = {}, reference = FIELD_REFERENCE_CODES.MEMO.id): Field {
  return makeField({ column: { reference } as Field["column"], ...overrides });
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
      makeField({ id: "a" }),
      makeField({ id: "b" }),
      makeField({ id: "c" }),
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

describe("isFullWidthField", () => {
  it.each(LONG_TEXT_REFERENCE_IDS)("is true for reference %s without explicit colspan", (reference) => {
    expect(isFullWidthField(makeTextField({}, reference))).toBe(true);
  });

  it("is false when the metadata defines an explicit colspan", () => {
    expect(isFullWidthField(makeTextField({ obuiappColspan: 1 }))).toBe(false);
  });

  it.each([FIELD_REFERENCE_CODES.IMAGE.id, FIELD_REFERENCE_CODES.MULTI_SELECTOR.id, FIELD_REFERENCE_CODES.STRING.id])(
    "is false for reference %s",
    (reference) => {
      expect(isFullWidthField(makeTextField({}, reference))).toBe(false);
    }
  );

  it("is false for a field without column reference", () => {
    expect(isFullWidthField(makeField({ column: undefined as unknown as Field["column"] }))).toBe(false);
  });
});

describe("getEffectiveColspan", () => {
  it("returns the explicit colspan", () => {
    expect(getEffectiveColspan(makeTextField({ obuiappColspan: 2 }))).toBe(2);
  });

  it("returns the full grid width for long-text fields", () => {
    expect(getEffectiveColspan(makeTextField())).toBe(FORM_GRID_COLUMNS);
  });

  it("returns 1 for regular fields", () => {
    expect(getEffectiveColspan(makeField({}))).toBe(1);
  });
});

describe("computeFieldLayout with full-width fields", () => {
  it("starts a full-width field on column 1 after a regular field", () => {
    const fields = [makeField({ id: "a" }), makeTextField({ id: "b" })];
    expect(computeFieldLayout(fields).get("b")).toEqual({ colStart: 1 });
  });

  it("closes the row so a following startinoddcolumn field needs no override", () => {
    const fields = [makeField({ id: "a" }), makeTextField({ id: "b" }), makeField({ id: "c", startinoddcolumn: true })];
    expect(computeFieldLayout(fields).get("c")).toBeUndefined();
  });

  it("ignores startinoddcolumn on an even cursor and keeps column 1", () => {
    const fields = [makeField({ id: "a" }), makeTextField({ id: "b", startinoddcolumn: true })];
    expect(computeFieldLayout(fields).get("b")).toEqual({ colStart: 1 });
  });

  it("keeps the previous behavior for a long-text field with explicit colspan", () => {
    const fields = [
      makeTextField({ id: "a", obuiappColspan: 2 }),
      makeField({ id: "b" }),
      makeField({ id: "c", startinoddcolumn: true }),
    ];
    const result = computeFieldLayout(fields);
    expect(result.get("a")).toBeUndefined();
    expect(result.get("c")).toBeUndefined();
  });
});
