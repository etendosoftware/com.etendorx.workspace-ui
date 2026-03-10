import { FieldType, type Field } from "@workspaceui/api-client/src/api/types";
import { getFieldReference, sanitizeValue, formatLabel, getMessageType, buildPayloadByInputName } from "../index";
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
    expect(getFieldReference()).toBe(FieldType.TEXT);
  });
});

describe("sanitizeValue", () => {
  it("converts true to 'Y' and false to 'N'", () => {
    expect(sanitizeValue(true)).toBe("Y");
    expect(sanitizeValue(false)).toBe("N");
  });

  it("converts null string to null", () => {
    expect(sanitizeValue(null)).toBeNull();
  });

  it("returns numbers as-is for non-typed fields", () => {
    expect(sanitizeValue(42)).toBe(42);
  });

  it("converts DATE field value from yyyy-mm-dd to dd-mm-yyyy", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.DATE.id } } as unknown as Field;
    expect(sanitizeValue("2024-03-15", field)).toBe("15-03-2024");
  });

  it("returns null for empty DATE field value", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.DATE.id } } as unknown as Field;
    expect(sanitizeValue("", field)).toBeNull();
    expect(sanitizeValue(null, field)).toBeNull();
  });

  it("converts numeric string to number for NUMBER field", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.INTEGER.id } } as unknown as Field;
    expect(sanitizeValue("42", field)).toBe(42);
    expect(sanitizeValue("3.14", field)).toBeCloseTo(3.14);
  });

  it("returns null for empty QUANTITY field value", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.QUANTITY_22.id } } as unknown as Field;
    expect(sanitizeValue("", field)).toBeNull();
    expect(sanitizeValue(null, field)).toBeNull();
  });

  it("handles consumptionDays field by name", () => {
    const field = { inputName: "consumptionDays", column: {} } as unknown as Field;
    expect(sanitizeValue("5", field)).toBe(5);
    expect(sanitizeValue("", field)).toBeNull();
    expect(sanitizeValue(null, field)).toBeNull();
  });
});

describe("formatLabel", () => {
  it("replaces %s with the count when present", () => {
    expect(formatLabel("Selected: %s items", 3)).toBe("Selected: 3 items");
  });

  it("returns undefined when label has no %s placeholder", () => {
    expect(formatLabel("No placeholder", 3)).toBeUndefined();
  });

  it("returns undefined when count is not provided", () => {
    expect(formatLabel("Count: %s")).toBeUndefined();
  });
});

describe("getMessageType", () => {
  it("returns 'error' for error sender", () => {
    expect(getMessageType("error")).toBe("error");
  });

  it("returns 'right-user' for user sender", () => {
    expect(getMessageType("user")).toBe("right-user");
  });

  it("returns 'left-user' for any other sender", () => {
    expect(getMessageType("bot")).toBe("left-user");
    expect(getMessageType("system")).toBe("left-user");
  });
});

describe("buildPayloadByInputName", () => {
  it("returns null when values is null or undefined", () => {
    expect(buildPayloadByInputName(null)).toBeNull();
    expect(buildPayloadByInputName(undefined)).toBeNull();
  });

  it("maps field values using inputName from field metadata", () => {
    const fields = { businessPartner: { inputName: "inpcBpartnerId" } } as unknown as Record<string, Field>;
    const result = buildPayloadByInputName({ businessPartner: "123" }, fields);
    expect(result).toHaveProperty("inpcBpartnerId", "123");
    expect(result).not.toHaveProperty("businessPartner");
  });

  it("keeps key as-is when no field metadata exists", () => {
    const result = buildPayloadByInputName({ unknownField: "value" });
    expect(result).toHaveProperty("unknownField", "value");
  });

  it("maps documentAction to DocAction", () => {
    const result = buildPayloadByInputName({ documentAction: "CO" });
    expect(result).toHaveProperty("DocAction", "CO");
    expect(result).not.toHaveProperty("documentAction");
  });

  it("maps inpporeference to POReference", () => {
    const result = buildPayloadByInputName({ inpporeference: "REF-001" });
    expect(result).toHaveProperty("POReference", "REF-001");
  });

  it("sanitizes boolean values to Y/N via field metadata", () => {
    const fields = { isActive: { column: { reference: FIELD_REFERENCE_CODES.BOOLEAN.id } } } as unknown as Record<string, Field>;
    const result = buildPayloadByInputName({ isActive: true }, fields);
    expect(result?.isActive).toBe("Y");
  });
});
