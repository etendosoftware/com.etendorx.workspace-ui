import { FieldType } from "@workspaceui/api-client/src/api/types";
import { getFieldReference, sanitizeValue, formatLabel, getMessageType, buildPayloadByInputName } from "../index";
import { FIELD_REFERENCE_CODES } from "../form/constants";

describe("getFieldReference", () => {
  it("returns TEXT for STRING reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.STRING)).toBe(FieldType.TEXT);
  });

  it("returns TABLEDIR for TABLE_DIR and PRODUCT and SELECTOR references", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.TABLE_DIR_19)).toBe(FieldType.TABLEDIR);
    expect(getFieldReference(FIELD_REFERENCE_CODES.TABLE_DIR_18)).toBe(FieldType.TABLEDIR);
    expect(getFieldReference(FIELD_REFERENCE_CODES.PRODUCT)).toBe(FieldType.TABLEDIR);
    expect(getFieldReference(FIELD_REFERENCE_CODES.SELECTOR)).toBe(FieldType.TABLEDIR);
  });

  it("returns DATE for DATE reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.DATE)).toBe(FieldType.DATE);
  });

  it("returns DATETIME for DATETIME reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.DATETIME)).toBe(FieldType.DATETIME);
  });

  it("returns BOOLEAN for BOOLEAN reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.BOOLEAN)).toBe(FieldType.BOOLEAN);
  });

  it("returns NUMBER for INTEGER, NUMERIC, and DECIMAL references", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.INTEGER)).toBe(FieldType.NUMBER);
    expect(getFieldReference(FIELD_REFERENCE_CODES.NUMERIC)).toBe(FieldType.NUMBER);
    expect(getFieldReference(FIELD_REFERENCE_CODES.DECIMAL)).toBe(FieldType.NUMBER);
  });

  it("returns QUANTITY for QUANTITY references", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.QUANTITY_22)).toBe(FieldType.QUANTITY);
    expect(getFieldReference(FIELD_REFERENCE_CODES.QUANTITY_29)).toBe(FieldType.QUANTITY);
  });

  it("returns LIST for LIST references", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.LIST_17)).toBe(FieldType.LIST);
    expect(getFieldReference(FIELD_REFERENCE_CODES.LIST_13)).toBe(FieldType.LIST);
  });

  it("returns TIME for TIME reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.TIME)).toBe(FieldType.TIME);
  });

  it("returns BUTTON for reference '28'", () => {
    expect(getFieldReference("28")).toBe(FieldType.BUTTON);
  });

  it("returns SELECT for SELECT_30 reference", () => {
    expect(getFieldReference(FIELD_REFERENCE_CODES.SELECT_30)).toBe(FieldType.SELECT);
  });

  it("returns TEXT for unknown reference", () => {
    expect(getFieldReference("unknown")).toBe(FieldType.TEXT);
    expect(getFieldReference(undefined)).toBe(FieldType.TEXT);
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
    const field = { column: { reference: FIELD_REFERENCE_CODES.DATE } } as any;
    expect(sanitizeValue("2024-03-15", field)).toBe("15-03-2024");
  });

  it("returns null for empty DATE field value", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.DATE } } as any;
    expect(sanitizeValue("", field)).toBeNull();
    expect(sanitizeValue(null, field)).toBeNull();
  });

  it("converts numeric string to number for NUMBER field", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.INTEGER } } as any;
    expect(sanitizeValue("42", field)).toBe(42);
    expect(sanitizeValue("3.14", field)).toBeCloseTo(3.14);
  });

  it("returns null for empty QUANTITY field value", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.QUANTITY_22 } } as any;
    expect(sanitizeValue("", field)).toBeNull();
    expect(sanitizeValue(null, field)).toBeNull();
  });

  it("handles consumptionDays field by name", () => {
    const field = { inputName: "consumptionDays", column: {} } as any;
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
    const fields = { businessPartner: { inputName: "inpcBpartnerId" } } as any;
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
    const fields = { isActive: { column: { reference: FIELD_REFERENCE_CODES.BOOLEAN } } } as any;
    const result = buildPayloadByInputName({ isActive: true }, fields);
    expect(result?.isActive).toBe("Y");
  });
});
