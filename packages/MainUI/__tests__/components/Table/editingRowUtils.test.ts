import {
  getMergedRowData,
  hasValidationErrors,
  getFieldValue,
  createEmptyRowData,
  insertNewRowAtTop,
  removeNewRowFromRecords,
} from "@/components/Table/utils/editingRowUtils";
import type { EditingRowData } from "@/components/Table/types/inlineEditing";
import { FieldType } from "@workspaceui/api-client/src/api/types";

jest.mock("@/utils", () => ({
  getFieldReference: (ref: number | undefined) => {
    if (ref === 20) return FieldType.BOOLEAN;
    if (ref === 11) return FieldType.NUMBER;
    if (ref === 29) return FieldType.QUANTITY;
    if (ref === 15) return FieldType.DATE;
    if (ref === 16) return FieldType.DATETIME;
    return FieldType.TEXT;
  },
}));

const makeEditingRow = (overrides: Partial<EditingRowData> = {}): EditingRowData => ({
  originalData: { id: "row1", name: "Original", amount: 100 },
  modifiedData: {},
  isNew: false,
  validationErrors: {},
  isSaving: false,
  hasUnsavedChanges: false,
  ...overrides,
});

describe("getMergedRowData", () => {
  it("returns original data when no modifications", () => {
    const row = makeEditingRow();
    const result = getMergedRowData(row);
    expect(result).toEqual({ id: "row1", name: "Original", amount: 100 });
  });

  it("overrides original with modified values", () => {
    const row = makeEditingRow({
      modifiedData: { name: "Modified" },
    });
    const result = getMergedRowData(row);
    expect(result.name).toBe("Modified");
    expect(result.amount).toBe(100);
  });

  it("filters out undefined modified values", () => {
    const row = makeEditingRow({
      modifiedData: { name: undefined as any },
    });
    const result = getMergedRowData(row);
    expect(result.name).toBe("Original");
  });
});

describe("hasValidationErrors", () => {
  it("returns false when no errors", () => {
    expect(hasValidationErrors(makeEditingRow())).toBe(false);
  });

  it("returns false when errors are undefined", () => {
    const row = makeEditingRow({ validationErrors: { name: undefined } });
    expect(hasValidationErrors(row)).toBe(false);
  });

  it("returns false when errors are empty strings", () => {
    const row = makeEditingRow({ validationErrors: { name: "  " } });
    expect(hasValidationErrors(row)).toBe(false);
  });

  it("returns true when there are real errors", () => {
    const row = makeEditingRow({ validationErrors: { name: "Required field" } });
    expect(hasValidationErrors(row)).toBe(true);
  });
});

describe("getFieldValue", () => {
  it("returns modified value when field was modified", () => {
    const row = makeEditingRow({
      modifiedData: { name: "New Name" },
    });
    expect(getFieldValue(row, "name")).toBe("New Name");
  });

  it("returns original value when field was not modified", () => {
    const row = makeEditingRow();
    expect(getFieldValue(row, "name")).toBe("Original");
  });

  it("returns modified value even if it is null", () => {
    const row = makeEditingRow({
      modifiedData: { name: null as any },
    });
    expect(getFieldValue(row, "name")).toBeNull();
  });
});

describe("createEmptyRowData", () => {
  it("creates row with just id when no columns", () => {
    const result = createEmptyRowData("new_1");
    expect(result).toEqual({ id: "new_1" });
  });

  it("initializes boolean columns to false", () => {
    const columns = [{ name: "active", column: { reference: 20 } }];
    const result = createEmptyRowData("new_1", columns);
    expect(result.active).toBe(false);
  });

  it("initializes number columns to null", () => {
    const columns = [{ name: "amount", column: { reference: 11 } }];
    const result = createEmptyRowData("new_1", columns);
    expect(result.amount).toBeNull();
  });

  it("skips id and actions columns", () => {
    const columns = [
      { name: "id", column: { reference: 10 } },
      { name: "actions", column: { reference: 10 } },
      { name: "description", column: { reference: 10 } },
    ];
    const result = createEmptyRowData("new_1", columns);
    expect(result.id).toBe("new_1");
    expect(result).not.toHaveProperty("actions");
    expect(result.description).toBeNull();
  });
});

describe("insertNewRowAtTop", () => {
  it("inserts new row at beginning", () => {
    const existing = [{ id: "1" }, { id: "2" }];
    const newRow = { id: "new" };
    const result = insertNewRowAtTop(existing, newRow);
    expect(result[0].id).toBe("new");
    expect(result).toHaveLength(3);
  });

  it("does not mutate original array", () => {
    const existing = [{ id: "1" }];
    insertNewRowAtTop(existing, { id: "new" });
    expect(existing).toHaveLength(1);
  });
});

describe("removeNewRowFromRecords", () => {
  it("removes row by id", () => {
    const records = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const result = removeNewRowFromRecords(records, "2");
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.id === "2")).toBeUndefined();
  });

  it("returns same-length array when id not found", () => {
    const records = [{ id: "1" }];
    const result = removeNewRowFromRecords(records, "999");
    expect(result).toHaveLength(1);
  });
});
