import {
  getIdentifierKey,
  getEntriesKey,
  isTableDirField,
  processCalloutColumnValues,
  processCalloutAuxiliaryValues,
  getCalloutChangedFieldNames,
} from "../calloutUtils";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";

// Mock external dependencies
jest.mock("@workspaceui/api-client/src/utils/metadata", () => ({
  getFieldsByColumnName: jest.fn(),
  getFieldsByHqlName: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn() },
}));

import { getFieldsByColumnName, getFieldsByHqlName } from "@workspaceui/api-client/src/utils/metadata";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { logger } from "@/utils/logger";

const mockGetFieldsByColumnName = getFieldsByColumnName as jest.Mock;
const mockGetFieldsByHqlName = getFieldsByHqlName as jest.Mock;

// Minimal Field factory
const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    name: "testField",
    hqlName: "testField",
    inputName: undefined,
    column: undefined,
    ...overrides,
  }) as unknown as Field;

const EMPTY_TAB = {} as Tab;

// ─── getIdentifierKey ────────────────────────────────────────────────────────

describe("getIdentifierKey", () => {
  it("uses inputName when available", () => {
    const field = makeField({ inputName: "myInput", hqlName: "myHql", name: "myName" });
    expect(getIdentifierKey(field)).toBe("myInput$_identifier");
  });

  it("falls back to hqlName when inputName is absent", () => {
    const field = makeField({ inputName: undefined, hqlName: "myHql", name: "myName" });
    expect(getIdentifierKey(field)).toBe("myHql$_identifier");
  });

  it("falls back to name when both inputName and hqlName are absent", () => {
    const field = makeField({ inputName: undefined, hqlName: undefined, name: "myName" });
    expect(getIdentifierKey(field)).toBe("myName$_identifier");
  });
});

// ─── getEntriesKey ───────────────────────────────────────────────────────────

describe("getEntriesKey", () => {
  it("uses inputName when available", () => {
    const field = makeField({ inputName: "myInput" });
    expect(getEntriesKey(field)).toBe("myInput$_entries");
  });

  it("falls back to hqlName when inputName is absent", () => {
    const field = makeField({ inputName: undefined, hqlName: "myHql" });
    expect(getEntriesKey(field)).toBe("myHql$_entries");
  });

  it("falls back to name when both are absent", () => {
    const field = makeField({ inputName: undefined, hqlName: undefined, name: "fallback" });
    expect(getEntriesKey(field)).toBe("fallback$_entries");
  });
});

// ─── isTableDirField ─────────────────────────────────────────────────────────

describe("isTableDirField", () => {
  it("returns true for reference code 19 (TABLE_DIR_19)", () => {
    const field = makeField({ column: { reference: "19" } as never });
    expect(isTableDirField(field)).toBe(true);
  });

  it("returns true for reference code 18 (TABLE_DIR_18)", () => {
    const field = makeField({ column: { reference: "18" } as never });
    expect(isTableDirField(field)).toBe(true);
  });

  it("returns false for any other reference code", () => {
    const field = makeField({ column: { reference: "30" } as never });
    expect(isTableDirField(field)).toBe(false);
  });

  it("returns false when column is undefined", () => {
    const field = makeField({ column: undefined });
    expect(isTableDirField(field)).toBe(false);
  });
});

// ─── processCalloutColumnValues ───────────────────────────────────────────────

describe("processCalloutColumnValues", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty array when columnValues is undefined", () => {
    mockGetFieldsByColumnName.mockReturnValue({});
    const result = processCalloutColumnValues(undefined as never, EMPTY_TAB);
    expect(result).toEqual([]);
  });

  it("skips columns whose field is not found and logs a warning", () => {
    mockGetFieldsByColumnName.mockReturnValue({});
    const result = processCalloutColumnValues({ unknownCol: { value: "x", identifier: undefined } }, EMPTY_TAB);
    expect(result).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("unknownCol"));
  });

  it("maps a simple column value to a field update", () => {
    const field = makeField({ hqlName: "price", name: "price" });
    mockGetFieldsByColumnName.mockReturnValue({ price: field });

    const result = processCalloutColumnValues({ price: { value: 99, identifier: undefined } }, EMPTY_TAB);

    expect(result).toEqual([{ fieldName: "price", value: 99, identifier: undefined }]);
  });

  it("creates synthetic entry for TABLEDIR field with identifier but no entries", () => {
    const field = makeField({ hqlName: "product", name: "product", column: { reference: "19" } as never });
    mockGetFieldsByColumnName.mockReturnValue({ product: field });

    const result = processCalloutColumnValues({ product: { value: "ABC123", identifier: "Product Name" } }, EMPTY_TAB);

    expect(result[0].entries).toEqual([{ id: "ABC123", value: "ABC123", label: "Product Name" }]);
  });

  it("maps entries array when present", () => {
    const field = makeField({ hqlName: "category", name: "category" });
    mockGetFieldsByColumnName.mockReturnValue({ category: field });

    const columnValue = {
      value: "cat1",
      identifier: "Category 1",
      entries: [{ id: "cat1", _identifier: "Category 1" }],
    };

    const result = processCalloutColumnValues({ category: columnValue as never }, EMPTY_TAB);

    expect(result[0].entries).toEqual([{ id: "cat1", value: "cat1", label: "Category 1" }]);
  });

  it("uses columnName as fieldName when hqlName is absent", () => {
    const field = makeField({ hqlName: undefined, name: "fallbackName" });
    mockGetFieldsByColumnName.mockReturnValue({ myCol: field });

    const result = processCalloutColumnValues({ myCol: { value: "v", identifier: undefined } }, EMPTY_TAB);
    expect(result[0].fieldName).toBe("myCol");
  });
});

// ─── processCalloutAuxiliaryValues ───────────────────────────────────────────

describe("processCalloutAuxiliaryValues", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty array when auxiliaryInputValues is undefined", () => {
    mockGetFieldsByColumnName.mockReturnValue({});
    const result = processCalloutAuxiliaryValues(undefined as never, EMPTY_TAB);
    expect(result).toEqual([]);
  });

  it("maps auxiliary values using hqlName when field is found", () => {
    const field = makeField({ hqlName: "discount", name: "discount" });
    mockGetFieldsByColumnName.mockReturnValue({ discount: field });

    const result = processCalloutAuxiliaryValues({ discount: { value: 10 } }, EMPTY_TAB);

    expect(result).toEqual([{ fieldName: "discount", value: 10 }]);
  });

  it("falls back to columnName when field is not found", () => {
    mockGetFieldsByColumnName.mockReturnValue({});

    const result = processCalloutAuxiliaryValues({ unknownAux: { value: "fallback" } }, EMPTY_TAB);

    expect(result).toEqual([{ fieldName: "unknownAux", value: "fallback" }]);
  });

  it("maps multiple auxiliary values", () => {
    const field1 = makeField({ hqlName: "field1" });
    const field2 = makeField({ hqlName: "field2" });
    mockGetFieldsByColumnName.mockReturnValue({ col1: field1, col2: field2 });

    const result = processCalloutAuxiliaryValues({ col1: { value: "a" }, col2: { value: "b" } }, EMPTY_TAB);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ fieldName: "field1", value: "a" });
    expect(result[1]).toMatchObject({ fieldName: "field2", value: "b" });
  });
});

// ─── getCalloutChangedFieldNames ─────────────────────────────────────────────

describe("getCalloutChangedFieldNames", () => {
  const PRICE = "priceActual";
  const TAX = "tax";
  const ACTIVE = "active";
  const ROW_VALUES = { [PRICE]: 10, [TAX]: "TAX1", [ACTIVE]: true };

  beforeEach(() => {
    mockGetFieldsByHqlName.mockReturnValue({
      [PRICE]: makeField({ hqlName: PRICE }),
      [ACTIVE]: makeField({
        hqlName: ACTIVE,
        column: { reference: FIELD_REFERENCE_CODES.BOOLEAN.id } as Field["column"],
      }),
    });
  });

  it("returns only the fields whose value differs from the row value", () => {
    const updates = [
      { fieldName: PRICE, value: "12.5" },
      { fieldName: TAX, value: "TAX1", identifier: "Tax 1" },
    ];

    expect(getCalloutChangedFieldNames(ROW_VALUES, updates, EMPTY_TAB)).toEqual([PRICE]);
  });

  it("compares boolean fields once their Classic value is converted", () => {
    expect(getCalloutChangedFieldNames(ROW_VALUES, [{ fieldName: ACTIVE, value: "Y" }], EMPTY_TAB)).toEqual([]);
    expect(getCalloutChangedFieldNames(ROW_VALUES, [{ fieldName: ACTIVE, value: "" }], EMPTY_TAB)).toEqual([ACTIVE]);
  });

  it("returns nothing when the callout returned no updates", () => {
    expect(getCalloutChangedFieldNames(ROW_VALUES, [], EMPTY_TAB)).toEqual([]);
  });
});
