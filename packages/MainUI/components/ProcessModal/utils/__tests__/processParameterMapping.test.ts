import { mapFormValuesToContext, mapUpdatesToFormFields, getDbColumnName } from "../processParameterMapping";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

const makeParam = (name: string, dBColumnName?: string): ProcessParameter =>
  ({ name, dBColumnName }) as ProcessParameter;

describe("mapFormValuesToContext", () => {
  it("returns empty object for empty inputs", () => {
    expect(mapFormValuesToContext({}, {})).toEqual({});
  });

  it("maps form values using parameter name to DB column name", () => {
    const params = { p1: makeParam("myField", "MY_FIELD") };
    const result = mapFormValuesToContext({ myField: "value" }, params);
    expect(result["MY_FIELD"]).toBe("value");
    // also preserves original key
    expect(result["myField"]).toBe("value");
  });

  it("keeps key unchanged when no matching parameter", () => {
    const result = mapFormValuesToContext({ unknownKey: 42 }, {});
    expect(result["unknownKey"]).toBe(42);
  });

  it("keeps key unchanged when name === dBColumnName", () => {
    const params = { p1: makeParam("SAME", "SAME") };
    const result = mapFormValuesToContext({ SAME: "val" }, params);
    expect(result["SAME"]).toBe("val");
    expect(Object.keys(result)).toHaveLength(1);
  });

  it("handles multiple parameters", () => {
    const params = {
      p1: makeParam("fieldA", "COL_A"),
      p2: makeParam("fieldB", "COL_B"),
    };
    const result = mapFormValuesToContext({ fieldA: 1, fieldB: 2 }, params);
    expect(result["COL_A"]).toBe(1);
    expect(result["COL_B"]).toBe(2);
  });
});

describe("mapUpdatesToFormFields", () => {
  it("returns empty object for empty inputs", () => {
    expect(mapUpdatesToFormFields({}, {})).toEqual({});
  });

  it("maps DB column name to form field name", () => {
    const params = { p1: makeParam("myField", "MY_FIELD") };
    const result = mapUpdatesToFormFields({ MY_FIELD: "val" }, params);
    expect(result["myField"]).toBe("val");
  });

  it("maps case-insensitively", () => {
    const params = { p1: makeParam("myField", "MY_FIELD") };
    const result = mapUpdatesToFormFields({ my_field: "val" }, params);
    expect(result["myField"]).toBe("val");
  });

  it("handles object values with id and identifier", () => {
    const params = { p1: makeParam("product", "C_PRODUCT_ID") };
    const result = mapUpdatesToFormFields({ C_PRODUCT_ID: { id: "123", identifier: "Widget" } }, params);
    expect(result["product"]).toBe("123");
    expect(result["product$_identifier"]).toBe("Widget");
  });

  it("keeps unknown keys as-is", () => {
    const result = mapUpdatesToFormFields({ unknownCol: "x" }, {});
    expect(result["unknownCol"]).toBe("x");
  });

  it("includes original key alongside mapped field name when they differ", () => {
    const params = { p1: makeParam("fieldName", "DB_COL") };
    const result = mapUpdatesToFormFields({ DB_COL: "abc" }, params);
    expect(result["fieldName"]).toBe("abc");
    expect(result["DB_COL"]).toBe("abc");
  });
});

describe("getDbColumnName", () => {
  it("returns the DB column name when parameter found by name", () => {
    const params = { p1: makeParam("myField", "MY_COL") };
    expect(getDbColumnName("myField", params)).toBe("MY_COL");
  });

  it("returns original field name when parameter not found", () => {
    expect(getDbColumnName("unknown", {})).toBe("unknown");
  });

  it("returns original field name when parameter has no dBColumnName", () => {
    const params = { p1: makeParam("myField") };
    expect(getDbColumnName("myField", params)).toBe("myField");
  });
});
