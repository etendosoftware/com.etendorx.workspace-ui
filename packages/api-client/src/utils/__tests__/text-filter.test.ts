import { isTextFilterValue, type TextFilterOperator } from "../column-filter-utils";
import { LegacyColumnFilterUtils } from "../search-utils";
import type { Column, BaseCriteria } from "../../api/types";
import { FieldType } from "../../api/types";

// ── isTextFilterValue ────────────────────────────────────────────────────────

describe("isTextFilterValue", () => {
  it.each<[string, unknown, boolean]>([
    ["valid TextFilterValue", { text: "hello", operator: "iContains" }, true],
    ["iContains operator", { text: "", operator: "iContains" }, true],
    ["iStartsWith operator", { text: "", operator: "iStartsWith" }, true],
    ["equals operator", { text: "", operator: "equals" }, true],
    ["plain string", "hello", false],
    ["null", null, false],
    ["undefined", undefined, false],
    ["number", 42, false],
    ["array", ["iContains", "hello"], false],
    ["object missing operator", { text: "hello" }, false],
    ["object missing text", { operator: "iContains" }, false],
    ["empty object", {}, false],
  ])("returns %s → %s", (_label, input, expected) => {
    expect(isTextFilterValue(input)).toBe(expected);
  });
});

// ── LegacyColumnFilterUtils — TextFilterValue handling ──────────────────────

const column: Column = {
  id: "col1",
  columnName: "documentNo",
  name: "Document No.",
  type: "string",
  fieldType: FieldType.TEXT,
} as unknown as Column;

const buildCriteria = (text: string, operator: TextFilterOperator) =>
  LegacyColumnFilterUtils.createColumnFilterCriteria([{ id: "documentNo", value: { text, operator } }], [column]);

const getDocNoCriteria = (text: string, operator: TextFilterOperator) =>
  buildCriteria(text, operator).filter((c: BaseCriteria) => c.fieldName === "documentNo");

describe("LegacyColumnFilterUtils — TextFilterValue criteria", () => {
  it.each<[TextFilterOperator, string]>([
    ["iContains", "ABC"],
    ["iStartsWith", "SO"],
    ["equals", "100"],
  ])("builds %s criteria with the correct operator and value", (operator, text) => {
    expect(buildCriteria(text, operator)).toEqual(
      expect.arrayContaining([expect.objectContaining({ fieldName: "documentNo", operator, value: text })])
    );
  });

  it.each([
    ["empty string", ""],
    ["whitespace only", "   "],
  ])("returns no criteria when text is %s", (_label, text) => {
    expect(getDocNoCriteria(text, "iContains")).toHaveLength(0);
  });

  it("trims surrounding whitespace from the text value", () => {
    expect(buildCriteria("  trimmed  ", "iContains")).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: "trimmed" })])
    );
  });
});
