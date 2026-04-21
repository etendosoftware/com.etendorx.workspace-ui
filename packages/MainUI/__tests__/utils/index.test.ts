import { getFieldReference } from "../../utils";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "../../utils/form/constants";

describe("utils/index - getFieldReference", () => {
  it("should return FieldType.TEXT for unknown reference", () => {
    expect(getFieldReference("unknown")).toBe(FieldType.TEXT);
  });

  it("should return FieldType.TEXT for STRING reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.STRING.id)).toBe(FieldType.TEXT);
  });

  it("should return FieldType.DATE for DATE reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.DATE.id)).toBe(FieldType.DATE);
  });

  it("should return FieldType.DATETIME for DATETIME reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.DATETIME.id)).toBe(FieldType.DATETIME);
  });

  it("should return FieldType.BOOLEAN for BOOLEAN reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.BOOLEAN.id)).toBe(FieldType.BOOLEAN);
  });

  it("should return FieldType.NUMBER for INTEGER reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.INTEGER.id)).toBe(FieldType.NUMBER);
  });

  it("should return FieldType.LIST for LIST_17 reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.LIST_17.id)).toBe(FieldType.LIST);
  });

  it("should return FieldType.IMAGE for IMAGE reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.IMAGE.id)).toBe(FieldType.IMAGE);
  });

  it("should return FieldType.SELECT for SELECT_30 reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.SELECT_30.id)).toBe(FieldType.SELECT);
  });

  it("should return FieldType.WINDOW for WINDOW reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.WINDOW.id)).toBe(FieldType.WINDOW);
  });
});
