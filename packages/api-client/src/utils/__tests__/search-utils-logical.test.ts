import { LegacyColumnFilterUtils } from "../search-utils";
import type { Column } from "../../api/types";

describe("LegacyColumnFilterUtils - Logical Filters", () => {
  const mockColumn: Column = {
    id: "testCol",
    columnName: "testCol",
    name: "Test Column",
    header: "Test Column",
    accessorFn: (row) => row.testCol,
    _identifier: "testCol",
    type: "string",
    referencedTabId: null,
  };

  const mockNumberColumn: Column = {
    ...mockColumn,
    type: "integer",
  };

  it("should parse simple string value", () => {
    const result = LegacyColumnFilterUtils["parseLogicalFilter"]("testCol", "abc", mockColumn);
    expect(result).toEqual({
      fieldName: "testCol",
      operator: "iContains",
      value: "abc",
    });
  });

  it("should parse OR condition with |", () => {
    const result = LegacyColumnFilterUtils["parseLogicalFilter"]("testCol", "abc|def", mockColumn);
    expect(result).toEqual({
      operator: "or",
      criteria: [
        { fieldName: "testCol", operator: "iContains", value: "abc" },
        { fieldName: "testCol", operator: "iContains", value: "def" },
      ],
    });
  });

  it("should parse OR condition with ' or '", () => {
    const result = LegacyColumnFilterUtils["parseLogicalFilter"]("testCol", "abc or def", mockColumn);
    expect(result).toEqual({
      operator: "or",
      criteria: [
        { fieldName: "testCol", operator: "iContains", value: "abc" },
        { fieldName: "testCol", operator: "iContains", value: "def" },
      ],
    });
  });

  it("should parse AND condition with &", () => {
    const result = LegacyColumnFilterUtils["parseLogicalFilter"]("testCol", ">10 & <20", mockNumberColumn);
    // Note: >10 becomes greaterThan 10, <20 becomes lessThan 20
    expect(result).toEqual({
      operator: "and",
      criteria: [
        { fieldName: "testCol", operator: "greaterThan", value: 10 },
        { fieldName: "testCol", operator: "lessThan", value: 20 },
      ],
    });
  });

  it("should parse NOT condition with !", () => {
    const result = LegacyColumnFilterUtils["parseLogicalFilter"]("testCol", "!abc", mockColumn);
    expect(result).toEqual({
      fieldName: "testCol",
      operator: "notContains",
      value: "abc",
    });
  });

  it("should parse comparison operators", () => {
    const result = LegacyColumnFilterUtils["parseLogicalFilter"]("testCol", ">=10", mockNumberColumn);
    expect(result).toEqual({
      fieldName: "testCol",
      operator: "greaterOrEqual",
      value: 10,
    });
  });

  it("should parse combined conditions (AND inside OR)", () => {
    // A & B | C -> OR(AND(A, B), C)
    const result = LegacyColumnFilterUtils["parseLogicalFilter"]("testCol", ">10 & <20 | =30", mockNumberColumn);
    expect(result).toEqual({
      operator: "or",
      criteria: [
        {
          operator: "and",
          criteria: [
            { fieldName: "testCol", operator: "greaterThan", value: 10 },
            { fieldName: "testCol", operator: "lessThan", value: 20 },
          ],
        },
        { fieldName: "testCol", operator: "equals", value: 30 },
      ],
    });
  });
});
