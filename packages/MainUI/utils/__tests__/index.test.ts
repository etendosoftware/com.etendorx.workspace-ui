import { FieldType } from "@workspaceui/api-client/src/api/types";
import { getFieldReference } from "../index";
import { FIELD_REFERENCE_CODES } from "../form/constants";

describe("MainUI Utils - getFieldReference", () => {
  it("should map STRING.id to FieldType.TEXT", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.STRING.id)).toBe(FieldType.TEXT);
  });

  it("should map TABLE_DIR_19.id to FieldType.TABLEDIR", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.TABLE_DIR_19.id)).toBe(FieldType.TABLEDIR);
  });

  it("should map PRODUCT.id to FieldType.TABLEDIR", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.PRODUCT.id)).toBe(FieldType.TABLEDIR);
  });

  it("should map SELECTOR.id to FieldType.TABLEDIR", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.SELECTOR.id)).toBe(FieldType.TABLEDIR);
  });

  it("should map TABLE_DIR_18.id to FieldType.TABLEDIR", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.TABLE_DIR_18.id)).toBe(FieldType.TABLEDIR);
  });

  it("should map DATE.id to FieldType.DATE", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.DATE.id)).toBe(FieldType.DATE);
  });

  it("should map DATETIME.id to FieldType.DATETIME", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.DATETIME.id)).toBe(FieldType.DATETIME);
  });

  it("should map BOOLEAN.id to FieldType.BOOLEAN", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.BOOLEAN.id)).toBe(FieldType.BOOLEAN);
  });

  it("should map INTEGER.id to FieldType.NUMBER", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.INTEGER.id)).toBe(FieldType.NUMBER);
  });

  it("should map NUMERIC.id to FieldType.NUMBER", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.NUMERIC.id)).toBe(FieldType.NUMBER);
  });

  it("should map DECIMAL.id to FieldType.NUMBER", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.DECIMAL.id)).toBe(FieldType.NUMBER);
  });

  it("should map QUANTITY_22.id to FieldType.QUANTITY", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.QUANTITY_22.id)).toBe(FieldType.QUANTITY);
  });

  it("should map QUANTITY_29.id to FieldType.QUANTITY", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.QUANTITY_29.id)).toBe(FieldType.QUANTITY);
  });

  it("should map LIST_17.id to FieldType.LIST", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.LIST_17.id)).toBe(FieldType.LIST);
  });

  it("should map LIST_13.id to FieldType.LIST", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.LIST_13.id)).toBe(FieldType.LIST);
  });

  it("should map TIME.id to FieldType.TIME", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.TIME.id)).toBe(FieldType.TIME);
  });

  it("should map '28' to FieldType.BUTTON", () => {
    expect(getFieldReference("28")).toBe(FieldType.BUTTON);
  });

  it("should map SELECT_30.id to FieldType.SELECT", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.SELECT_30.id)).toBe(FieldType.SELECT);
  });

  it("should map WINDOW.id to FieldType.WINDOW", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.WINDOW.id)).toBe(FieldType.WINDOW);
  });

  it("should return FieldType.TEXT for unknown reference", () => {
    expect(getFieldReference("unknown")).toBe(FieldType.TEXT);
  });

  it("should return FieldType.TEXT for undefined reference", () => {
    expect(getFieldReference(undefined)).toBe(FieldType.TEXT);
  });
});
