/**
 * Tests for utils/form/selectors/utils.tsx
 * Covers getSelectorFieldName and updateSelectorValue
 */

import { getSelectorFieldName, updateSelectorValue } from "../utils";
import type { Field } from "@workspaceui/api-client/src/api/types";

function createField(overrides: Partial<Field>): Field {
  return {
    id: "field-1",
    name: "testName",
    ...overrides,
  } as Field;
}

describe("getSelectorFieldName", () => {
  it("returns hqlName when present", () => {
    const field = createField({ hqlName: "myHqlName", columnName: "myColumn", name: "myName" });
    expect(getSelectorFieldName(field)).toBe("myHqlName");
  });

  it("returns columnName when hqlName is absent", () => {
    const field = createField({ hqlName: undefined, columnName: "myColumn", name: "myName" });
    expect(getSelectorFieldName(field)).toBe("myColumn");
  });

  it("returns name when both hqlName and columnName are absent", () => {
    const field = createField({ hqlName: undefined, columnName: undefined, name: "myName" });
    expect(getSelectorFieldName(field)).toBe("myName");
  });

  it("prefers hqlName over columnName when both are present", () => {
    const field = createField({ hqlName: "hql", columnName: "col", name: "nm" });
    expect(getSelectorFieldName(field)).toBe("hql");
  });

  it("prefers columnName over name when hqlName is absent", () => {
    const field = createField({ hqlName: "", columnName: "col", name: "nm" });
    expect(getSelectorFieldName(field)).toBe("col");
  });
});

describe("updateSelectorValue", () => {
  let mockSetValue: jest.Mock;

  beforeEach(() => {
    mockSetValue = jest.fn();
  });

  it("sets the main field value with shouldValidate and shouldDirty", () => {
    updateSelectorValue(mockSetValue, "myField", "someValue");
    expect(mockSetValue).toHaveBeenCalledWith("myField", "someValue", {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  it("does not set _data or $_identifier when data is undefined", () => {
    updateSelectorValue(mockSetValue, "myField", "someValue");
    expect(mockSetValue).toHaveBeenCalledTimes(1);
  });

  it("sets ${fieldName}_data when data is provided", () => {
    updateSelectorValue(mockSetValue, "myField", "someId", { _identifier: "Test Name" });
    expect(mockSetValue).toHaveBeenCalledWith("myField_data", { _identifier: "Test Name" });
  });

  it("sets identifier using displayField value when displayField is provided and data has that field", () => {
    updateSelectorValue(mockSetValue, "myField", "someId", { displayName: "Display Value" }, "displayName");
    expect(mockSetValue).toHaveBeenCalledWith("myField$_identifier", "Display Value", {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  it("falls back to data._identifier when displayField is not provided", () => {
    updateSelectorValue(mockSetValue, "myField", "someId", { _identifier: "ID Label" });
    expect(mockSetValue).toHaveBeenCalledWith("myField$_identifier", "ID Label", {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  it("falls back to data.name when _identifier is missing", () => {
    updateSelectorValue(mockSetValue, "myField", "someId", { name: "Record Name" });
    expect(mockSetValue).toHaveBeenCalledWith("myField$_identifier", "Record Name", {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  it("falls back to data.id when name and _identifier are missing", () => {
    updateSelectorValue(mockSetValue, "myField", "someId", { id: "rec-123" });
    expect(mockSetValue).toHaveBeenCalledWith("myField$_identifier", "rec-123", {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  it("falls back to value when all data properties are missing", () => {
    updateSelectorValue(mockSetValue, "myField", "fallback-value", {});
    expect(mockSetValue).toHaveBeenCalledWith("myField$_identifier", "fallback-value", {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  it("does not set $identifier when identifierValue resolves to undefined", () => {
    // data is empty object and value is undefined → identifierValue = undefined
    updateSelectorValue(mockSetValue, "myField", undefined, {});
    const identifierCall = mockSetValue.mock.calls.find((call) => call[0] === "myField$_identifier");
    expect(identifierCall).toBeUndefined();
  });

  it("ignores displayField when data does not have that key (falsy)", () => {
    updateSelectorValue(mockSetValue, "myField", "id-123", { _identifier: "Fallback" }, "nonExistentField");
    expect(mockSetValue).toHaveBeenCalledWith("myField$_identifier", "Fallback", {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  it("sets all three calls when full data is provided: main, _data, and $identifier", () => {
    updateSelectorValue(mockSetValue, "myField", "id-123", { _identifier: "Full Record", name: "Name" });
    expect(mockSetValue).toHaveBeenCalledTimes(3);
  });
});
