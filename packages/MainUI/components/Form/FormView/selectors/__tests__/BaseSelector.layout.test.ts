import { getFieldLayoutClasses } from "@/components/Form/FormView/selectors/BaseSelector";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import type { Field } from "@workspaceui/api-client/src/api/types";

const FULL_WIDTH_LABEL_CLASS = "w-[calc((100%-2.5rem)/9)]";
const DEFAULT_LABEL_CLASS = "w-1/3";
const DEFAULT_VALUE_CLASS = "w-2/3";
const EXPANDED_ROW_SPAN_CLASS = "row-span-4";
const FULL_ROW_SPAN_CLASS = "col-span-3";

function makeField(reference: string, overrides: Partial<Field> = {}): Field {
  return {
    id: "f1",
    hqlName: "field1",
    obuiappColspan: null,
    obuiappRowspan: null,
    column: { reference } as Field["column"],
    ...overrides,
  } as Field;
}

function containerClassesOf(field: Field, colStart?: number): string[] {
  return getFieldLayoutClasses(field, colStart).containerClassName.split(" ");
}

describe("getFieldLayoutClasses", () => {
  it.each([FIELD_REFERENCE_CODES.TEXT_LONG.id, FIELD_REFERENCE_CODES.MEMO.id, FIELD_REFERENCE_CODES.RICH_TEXT.id])(
    "spans the full row and keeps the vertical expansion for reference %s",
    (reference) => {
      const classes = getFieldLayoutClasses(makeField(reference));
      expect(classes.containerClassName.split(" ")).toEqual(
        expect.arrayContaining([FULL_ROW_SPAN_CLASS, EXPANDED_ROW_SPAN_CLASS])
      );
      expect(classes.labelWidthClass).toBe(FULL_WIDTH_LABEL_CLASS);
      expect(classes.valueWidthClass).toBe("flex-1 min-w-0");
    }
  );

  it.each([
    [1, "col-span-1"],
    [2, "col-span-2"],
  ])("respects an explicit colspan of %s on a long-text field", (colspan, expectedClass) => {
    const classes = getFieldLayoutClasses(makeField(FIELD_REFERENCE_CODES.MEMO.id, { obuiappColspan: colspan }));
    const containerClasses = classes.containerClassName.split(" ");
    expect(containerClasses).toContain(expectedClass);
    expect(containerClasses).not.toContain(FULL_ROW_SPAN_CLASS);
    expect(classes.labelWidthClass).toBe(DEFAULT_LABEL_CLASS);
  });

  it("uses the metadata rowspan instead of the default expansion", () => {
    const containerClasses = containerClassesOf(makeField(FIELD_REFERENCE_CODES.MEMO.id, { obuiappRowspan: 2 }));
    expect(containerClasses).toContain("row-span-2");
    expect(containerClasses).not.toContain(EXPANDED_ROW_SPAN_CLASS);
  });

  it.each([FIELD_REFERENCE_CODES.IMAGE.id, FIELD_REFERENCE_CODES.MULTI_SELECTOR.id])(
    "keeps reference %s expanded on a single column",
    (reference) => {
      const classes = getFieldLayoutClasses(makeField(reference));
      const containerClasses = classes.containerClassName.split(" ");
      expect(containerClasses).toContain(EXPANDED_ROW_SPAN_CLASS);
      expect(containerClasses).not.toContain(FULL_ROW_SPAN_CLASS);
      expect(classes.labelWidthClass).toBe(DEFAULT_LABEL_CLASS);
      expect(classes.valueWidthClass).toBe(DEFAULT_VALUE_CLASS);
    }
  );

  it("renders a regular field on a single row without span classes", () => {
    const classes = getFieldLayoutClasses(makeField(FIELD_REFERENCE_CODES.STRING.id));
    expect(classes.containerClassName).toBe("h-12 flex items-center");
    expect(classes.labelWidthClass).toBe(DEFAULT_LABEL_CLASS);
    expect(classes.valueWidthClass).toBe(DEFAULT_VALUE_CLASS);
  });

  it("applies the explicit rowspan and colspan of a regular field", () => {
    const containerClasses = containerClassesOf(
      makeField(FIELD_REFERENCE_CODES.STRING.id, { obuiappColspan: 2, obuiappRowspan: 2 })
    );
    expect(containerClasses).toEqual(expect.arrayContaining(["col-span-2", "row-span-2"]));
  });

  it("adds the column start class", () => {
    expect(containerClassesOf(makeField(FIELD_REFERENCE_CODES.MEMO.id), 1)).toContain("col-start-1");
  });
});
