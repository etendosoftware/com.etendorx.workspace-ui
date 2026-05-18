import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { Field, EntityData } from "@workspaceui/api-client/src/api/types";
import {
  validateFieldValue,
  validateRowData,
  validationErrorsToRecord,
  validateNewRowForSave,
  validateExistingRowForSave,
  hasRequiredFieldsForNewRow,
  validateFieldRealTime,
  validateRowForSave,
  createDebouncedValidation,
} from "../validationUtils";

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    name: "testField",
    description: "Test Field",
    type: FieldType.TEXT,
    isMandatory: false,
    isReadOnly: false,
    isUpdatable: true,
    refList: [],
    ...overrides,
  }) as Field;

describe("validationUtils", () => {
  describe("validateFieldValue", () => {
    it("should return error for empty mandatory field", () => {
      const field = makeField({ isMandatory: true });
      expect(validateFieldValue(field, "")).toContain("required");
      expect(validateFieldValue(field, null)).toContain("required");
      expect(validateFieldValue(field, undefined)).toContain("required");
    });

    it("should return undefined for empty optional field", () => {
      const field = makeField({ isMandatory: false });
      expect(validateFieldValue(field, "")).toBeUndefined();
      expect(validateFieldValue(field, null)).toBeUndefined();
    });

    describe("numeric validation", () => {
      const numField = makeField({ type: FieldType.NUMBER, name: "amount" });

      it("should accept valid numbers", () => {
        expect(validateFieldValue(numField, 42)).toBeUndefined();
        expect(validateFieldValue(numField, "42.5")).toBeUndefined();
      });

      it("should reject non-numeric strings", () => {
        expect(validateFieldValue(numField, "abc")).toContain("valid number");
      });

      it("should reject non-number/string types", () => {
        expect(validateFieldValue(numField, true)).toContain("must be a number");
      });
    });

    describe("quantity validation", () => {
      const qtyField = makeField({ type: FieldType.QUANTITY, name: "qty" });

      it("should reject negative quantities", () => {
        expect(validateFieldValue(qtyField, -5)).toContain("cannot be negative");
      });

      it("should accept zero and positive quantities", () => {
        expect(validateFieldValue(qtyField, 0)).toBeUndefined();
        expect(validateFieldValue(qtyField, 10)).toBeUndefined();
      });
    });

    describe("date validation", () => {
      const dateField = makeField({ type: FieldType.DATE, name: "date" });

      it("should accept valid date strings", () => {
        expect(validateFieldValue(dateField, "2025-01-15")).toBeUndefined();
      });

      it("should accept Date objects", () => {
        expect(validateFieldValue(dateField, new Date())).toBeUndefined();
      });

      it("should reject invalid date strings", () => {
        expect(validateFieldValue(dateField, "not-a-date")).toContain("valid date");
      });

      it("should reject non-date types", () => {
        expect(validateFieldValue(dateField, true)).toContain("valid date");
      });
    });

    describe("boolean validation", () => {
      const boolField = makeField({ type: FieldType.BOOLEAN, name: "active" });

      it("should accept valid boolean values", () => {
        expect(validateFieldValue(boolField, true)).toBeUndefined();
        expect(validateFieldValue(boolField, false)).toBeUndefined();
        expect(validateFieldValue(boolField, "Y")).toBeUndefined();
        expect(validateFieldValue(boolField, "N")).toBeUndefined();
      });

      it("should reject invalid boolean values", () => {
        expect(validateFieldValue(boolField, "maybe")).toContain("boolean");
      });
    });

    describe("list validation", () => {
      const listField = makeField({
        type: FieldType.LIST,
        name: "status",
        refList: [
          { value: "A", label: "Active" },
          { value: "I", label: "Inactive" },
        ] as any,
      });

      it("should accept valid list values", () => {
        expect(validateFieldValue(listField, "A")).toBeUndefined();
      });

      it("should reject invalid list values", () => {
        expect(validateFieldValue(listField, "X")).toContain("available options");
      });

      it("should skip validation when no refList", () => {
        const noListField = makeField({ type: FieldType.LIST, refList: [] });
        expect(validateFieldValue(noListField, "anything")).toBeUndefined();
      });
    });

    describe("text validation", () => {
      const textField = makeField({ type: FieldType.TEXT });

      it("should accept strings", () => {
        expect(validateFieldValue(textField, "hello")).toBeUndefined();
      });

      it("should reject non-string types", () => {
        expect(validateFieldValue(textField, 123)).toContain("must be text");
      });
    });
  });

  describe("validateRowData", () => {
    it("should return valid for valid row", () => {
      const fields = [makeField({ name: "name", isMandatory: true })];
      const rowData = { name: "Test" } as EntityData;
      const result = validateRowData(fields, rowData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for invalid row", () => {
      const fields = [makeField({ name: "name", isMandatory: true })];
      const rowData = { name: "" } as EntityData;
      const result = validateRowData(fields, rowData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should use hqlName to look up values", () => {
      const fields = [makeField({ name: "col", hqlName: "hqlCol", isMandatory: true } as any)];
      const rowData = { hqlCol: "value" } as EntityData;
      const result = validateRowData(fields, rowData);
      expect(result.isValid).toBe(true);
    });
  });

  describe("validationErrorsToRecord", () => {
    it("should convert errors array to record", () => {
      const errors = [
        { field: "name", message: "required", type: "required" as const },
        { field: "amount", message: "invalid", type: "format" as const },
      ];
      const result = validationErrorsToRecord(errors);
      expect(result.name).toBe("required");
      expect(result.amount).toBe("invalid");
    });

    it("should return empty record for no errors", () => {
      expect(validationErrorsToRecord([])).toEqual({});
    });
  });

  describe("validateNewRowForSave", () => {
    it("should skip system fields", () => {
      const fields = [
        makeField({ name: "id", isMandatory: true }),
        makeField({ name: "creationDate", isMandatory: true }),
      ];
      const result = validateNewRowForSave(fields, {} as EntityData);
      expect(result.isValid).toBe(true);
    });

    it("should skip readonly fields", () => {
      const fields = [makeField({ name: "f", isMandatory: true, isReadOnly: true } as any)];
      const result = validateNewRowForSave(fields, {} as EntityData);
      expect(result.isValid).toBe(true);
    });

    it("should validate mandatory fields", () => {
      const fields = [makeField({ name: "name", isMandatory: true })];
      const result = validateNewRowForSave(fields, { name: "" } as EntityData);
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateExistingRowForSave", () => {
    it("should only validate modified fields", () => {
      const fields = [makeField({ name: "name", type: FieldType.NUMBER })];
      const original = { name: "old" } as EntityData;
      const current = { name: "old" } as EntityData;
      const result = validateExistingRowForSave(fields, current, original);
      expect(result.isValid).toBe(true);
    });

    it("should report errors on modified invalid fields", () => {
      const fields = [makeField({ name: "amount", type: FieldType.NUMBER })];
      const original = { amount: 10 } as EntityData;
      const current = { amount: "abc" } as EntityData;
      const result = validateExistingRowForSave(fields, current, original);
      expect(result.isValid).toBe(false);
    });

    it("should skip system fields", () => {
      const fields = [makeField({ name: "id" })];
      const result = validateExistingRowForSave(fields, {} as EntityData, {} as EntityData);
      expect(result.isValid).toBe(true);
    });
  });

  describe("hasRequiredFieldsForNewRow", () => {
    it("should return true when all required fields are filled", () => {
      const fields = [makeField({ name: "name", isMandatory: true })];
      expect(hasRequiredFieldsForNewRow(fields, { name: "Test" } as EntityData)).toBe(true);
    });

    it("should return false when required fields are empty", () => {
      const fields = [makeField({ name: "name", isMandatory: true })];
      expect(hasRequiredFieldsForNewRow(fields, { name: "" } as EntityData)).toBe(false);
    });

    it("should return true for optional fields regardless", () => {
      const fields = [makeField({ name: "note", isMandatory: false })];
      expect(hasRequiredFieldsForNewRow(fields, {} as EntityData)).toBe(true);
    });

    it("should skip system fields", () => {
      const fields = [makeField({ name: "id", isMandatory: true })];
      expect(hasRequiredFieldsForNewRow(fields, {} as EntityData)).toBe(true);
    });
  });

  describe("validateFieldRealTime", () => {
    it("should allow empty values by default", () => {
      const field = makeField({ isMandatory: true });
      const result = validateFieldRealTime(field, "");
      expect(result.isValid).toBe(true);
    });

    it("should reject empty mandatory fields when allowEmpty is false", () => {
      const field = makeField({ isMandatory: true });
      const result = validateFieldRealTime(field, "", { allowEmpty: false });
      expect(result.isValid).toBe(false);
    });

    it("should validate numbers in real time", () => {
      const field = makeField({ type: FieldType.NUMBER });
      expect(validateFieldRealTime(field, 42).isValid).toBe(true);
      expect(validateFieldRealTime(field, "abc", { showTypingErrors: true }).isValid).toBe(false);
    });

    it("should allow partial numeric input while typing", () => {
      const field = makeField({ type: FieldType.NUMBER });
      expect(validateFieldRealTime(field, "-").isValid).toBe(true);
      expect(validateFieldRealTime(field, "1.").isValid).toBe(true);
    });

    it("should validate dates in real time", () => {
      const field = makeField({ type: FieldType.DATE });
      expect(validateFieldRealTime(field, "2025-01-15").isValid).toBe(true);
    });

    it("should validate booleans in real time", () => {
      const field = makeField({ type: FieldType.BOOLEAN });
      expect(validateFieldRealTime(field, true).isValid).toBe(true);
      expect(validateFieldRealTime(field, "maybe").isValid).toBe(false);
    });

    it("should validate lists in real time", () => {
      const field = makeField({
        type: FieldType.LIST,
        refList: [{ value: "A", label: "Active" }] as any,
      });
      expect(validateFieldRealTime(field, "A").isValid).toBe(true);
      expect(validateFieldRealTime(field, "X").isValid).toBe(false);
    });
  });

  describe("validateRowForSave", () => {
    it("should validate all non-system fields", () => {
      const fields = [makeField({ name: "name", isMandatory: true }), makeField({ name: "id" })];
      const result = validateRowForSave(fields, { name: "" } as EntityData);
      expect(result.isValid).toBe(false);
    });

    it("should pass for valid row", () => {
      const fields = [makeField({ name: "name", isMandatory: true })];
      const result = validateRowForSave(fields, { name: "Test" } as EntityData);
      expect(result.isValid).toBe(true);
    });
  });

  describe("createDebouncedValidation", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should debounce validation calls", () => {
      const fn = jest.fn();
      const debounced = createDebouncedValidation(fn, 300);

      debounced("a");
      debounced("b");
      debounced("c");

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("c");
    });

    it("should use default delay of 300ms", () => {
      const fn = jest.fn();
      const debounced = createDebouncedValidation(fn);

      debounced("test");
      jest.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
