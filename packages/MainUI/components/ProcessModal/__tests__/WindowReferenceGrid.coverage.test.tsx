// Mock Next.js server dependencies
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

import { render, screen, fireEvent } from "@testing-library/react";
import type { Column, EntityData } from "@workspaceui/api-client/src/api/types";
import {
  getBooleanEditProps,
  GridTopToolbar,
  extractActualValue,
  mergeDefaultsIntoParams,
  mergeCurrentValuesIntoParams,
  resolveParentContextId,
  updateLocalRecordFromSelection,
  resetLocalRecordFields,
  applyDynamicKeys,
  buildValidColumnNames,
  applyRecordValues,
  evaluateFieldReadOnlyLogic,
  buildGridCriteria,
  resolveSortBy,
  buildDeselectedRecord,
  syncGridSelectionToLocalRecords,
  syncPersistentSelection,
  buildIsFieldReadOnly,
  findMatchingRecord,
  isFieldVisibleForContext,
} from "../WindowReferenceGrid";
import "@testing-library/jest-dom";

// Mock MRT components to avoid context errors
jest.mock("material-react-table", () => ({
  ...jest.requireActual("material-react-table"),
  MRT_ToggleFiltersButton: ({ onClick }: any) => (
    <button data-testid="MRT_ToggleFiltersButton__ce8544" onClick={onClick}>
      Filters
    </button>
  ),
  MRT_ShowHideColumnsButton: () => <button data-testid="MRT_ShowHideColumnsButton__ce8544">Columns</button>,
  MRT_ToggleDensePaddingButton: () => <button data-testid="MRT_ToggleDensePaddingButton__ce8544">Padding</button>,
  MRT_ToggleFullScreenButton: () => <button data-testid="MRT_ToggleFullScreenButton__ce8544">Full Screen</button>,
}));

describe("WindowReferenceGrid Coverage Tests", () => {
  describe("getBooleanEditProps", () => {
    it("should return the correct configuration for boolean fields", () => {
      const mockCell = { getValue: () => "Y" };
      const props = getBooleanEditProps(mockCell);

      expect(props.select).toBe(true);
      expect(props.children).toHaveLength(2);
      expect(props.SelectProps.native).toBe(true);
    });
  });

  describe("Utility Functions", () => {
    it("extractActualValue should extract value from object", () => {
      expect(extractActualValue({ value: "test" })).toBe("test");
      expect(extractActualValue("direct")).toBe("direct");
    });

    it("mergeDefaultsIntoParams should merge values", () => {
      const defaults = { a: "1", b: { value: "2" } };
      const merged: any = {};
      mergeDefaultsIntoParams(defaults, merged);
      expect(merged).toEqual({ a: "1", b: "2" });
    });

    it("mergeCurrentValuesIntoParams should merge and override", () => {
      const currents = { a: "3", c: "4" };
      const merged: any = { a: "1" };
      mergeCurrentValuesIntoParams(currents, merged);
      expect(merged).toEqual({ a: "3", c: "4" });
    });

    it("resolveParentContextId should resolve ID from various keys", () => {
      const recordValues = { inpkey: "12345678901234567890123456789012" };
      const { parentContextId } = resolveParentContextId("KEY", recordValues, {});
      expect(parentContextId).toBe("12345678901234567890123456789012");
    });

    it("updateLocalRecordFromSelection should update amounts", () => {
      const record = { id: "1", amount: 10 };
      const selection = { amount: 20 };
      const updated = updateLocalRecordFromSelection(record as any, selection);
      expect(updated?.amount).toBe(20);
    });

    it("resetLocalRecordFields should reset specific fields", () => {
      const record = { id: "1", amount: 10, paymentAmount: 5 };
      const reset = resetLocalRecordFields(record as any);
      expect(reset?.amount).toBe(0);
      expect(reset?.paymentAmount).toBe(0);
    });

    it("resetLocalRecordFields should preserve a read-only amount and still zero an editable field", () => {
      const record = { id: "1", amount: 10, paymentAmount: 5 };
      const isFieldReadOnly = (fieldName: string) => fieldName === "amount";
      const reset = resetLocalRecordFields(record as any, isFieldReadOnly);
      expect(reset?.amount).toBe(10); // read-only invoice amount is kept
      expect(reset?.paymentAmount).toBe(0); // editable field still zeroed
    });

    it("resetLocalRecordFields should return null when every resettable field is read-only", () => {
      const record = { id: "1", amount: 10, paymentAmount: 5 };
      const reset = resetLocalRecordFields(record as any, () => true);
      expect(reset).toBeNull();
    });

    it("applyDynamicKeys should apply org and client keys", () => {
      const recordValues = { inpadOrgId: "ORG1", inpadClientId: "CLIENT1" };
      const options: any = {};
      applyDynamicKeys(recordValues, undefined, options);
      expect(options.ad_org_id).toBe("ORG1");
      expect(options.ad_client_id).toBe("CLIENT1");
    });

    it("buildValidColumnNames should build a set of valid column names", () => {
      const tabFields = { f1: { columnName: "COL1" } };
      const propFields = [{ name: "PROP1" }];
      const result = buildValidColumnNames(tabFields, propFields);
      expect(result.has("col1")).toBe(true);
      expect(result.has("prop1")).toBe(true);
      expect(result.has("ad_org_id")).toBe(true);
    });

    it("applyRecordValues should apply record values to options", () => {
      const parameters = { p1: { name: "param1", dBColumnName: "COL1" } };
      const recordValues = { param1: "VAL1" };
      const validColumnNames = new Set(["col1"]);
      const options: any = {};
      applyRecordValues(parameters, recordValues, validColumnNames, options);
      expect(options.COL1).toBe("VAL1");
    });

    it("evaluateFieldReadOnlyLogic should return true for static read-only flags", () => {
      expect(evaluateFieldReadOnlyLogic({ readOnly: true }, {})).toBe(true);
      expect(evaluateFieldReadOnlyLogic({ isReadOnly: true }, {})).toBe(true);
    });

    it("buildGridCriteria should build criteria from filter expressions map", () => {
      const filterExpressions = {
        grid1: { field1: "val1" },
      };
      const result = buildGridCriteria(filterExpressions, "grid1");
      expect(result).toHaveLength(1);
      expect(result[0].fieldName).toBe("field1");
    });
  });

  describe("resolveSortBy", () => {
    const rawColumns = [{ id: "col1", columnName: "col1", header: "Col 1" }] as Column[];

    it("returns getSortByString result when sorting is active", () => {
      const sorting = [{ id: "col1", desc: false }];
      const result = resolveSortBy(sorting, rawColumns, [], undefined);
      expect(result).toBe("col1");
    });

    it("returns descending sort when desc=true", () => {
      const sorting = [{ id: "col1", desc: true }];
      const result = resolveSortBy(sorting, rawColumns, [], undefined);
      expect(result).toBe("-col1");
    });

    it("returns tabOrderBy when no sorting and no criteria", () => {
      const result = resolveSortBy([], rawColumns, [], "documentDate");
      expect(result).toBe("documentDate");
    });

    it("returns -documentNo fallback when no sorting and criteria present", () => {
      const result = resolveSortBy([], rawColumns, [{ fieldName: "x" }], undefined);
      expect(result).toBe("-documentNo");
    });

    it("returns tabOrderBy over -documentNo fallback when both apply", () => {
      const result = resolveSortBy([], rawColumns, [{ fieldName: "x" }], "myOrder");
      expect(result).toBe("myOrder");
    });

    it("returns undefined when no sorting, no criteria and no tabOrderBy", () => {
      const result = resolveSortBy([], rawColumns, [], undefined);
      expect(result).toBeUndefined();
    });
  });

  describe("buildDeselectedRecord", () => {
    it("clears obSelected when true", () => {
      const record = { id: "1", obSelected: true } as EntityData;
      const { updated, changed } = buildDeselectedRecord(record);
      expect(updated.obSelected).toBe(false);
      expect(changed).toBe(true);
    });

    it("resets payment to 0 when non-zero", () => {
      const record = { id: "1", payment: 100 } as EntityData;
      const { updated, changed } = buildDeselectedRecord(record);
      expect(updated.payment).toBe(0);
      expect(changed).toBe(true);
    });

    it("resets amount to 0 when non-zero", () => {
      const record = { id: "1", amount: 50 } as EntityData;
      const { updated, changed } = buildDeselectedRecord(record);
      expect(updated.amount).toBe(0);
      expect(changed).toBe(true);
    });

    it("resets paymentAmount to 0 when non-zero", () => {
      const record = { id: "1", paymentAmount: 75 } as EntityData;
      const { updated, changed } = buildDeselectedRecord(record);
      expect(updated.paymentAmount).toBe(0);
      expect(changed).toBe(true);
    });

    it("does not mutate record when all fields are already reset", () => {
      const record = { id: "1", obSelected: false, payment: 0, amount: 0, paymentAmount: 0 } as EntityData;
      const { updated, changed } = buildDeselectedRecord(record);
      expect(changed).toBe(false);
      expect(updated).toEqual(record);
    });

    it("resets all payment fields at once", () => {
      const record = { id: "1", obSelected: true, payment: 10, amount: 20, paymentAmount: 30 } as EntityData;
      const { updated, changed } = buildDeselectedRecord(record);
      expect(changed).toBe(true);
      expect(updated.obSelected).toBe(false);
      expect(updated.payment).toBe(0);
      expect(updated.amount).toBe(0);
      expect(updated.paymentAmount).toBe(0);
    });
  });

  describe("GridTopToolbar", () => {
    const mockTable = {
      getSelectedRowModel: () => ({ rows: { length: 2 } }),
      getState: () => ({ columnFilters: [] }),
      setColumnFilters: jest.fn(),
    };

    const mockProps = {
      table: mockTable,
      parameterName: "Test Parameter",
      showTitle: true,
      t: (key: string) => key,
      handleClearSelections: jest.fn(),
      isImplicitFilterApplied: true,
      initialIsFilterApplied: false,
      handleMRTColumnFiltersChange: jest.fn(),
      setIsImplicitFilterApplied: jest.fn(),
    };

    it("should render the parameter name and results count", () => {
      render(<GridTopToolbar {...mockProps} />);

      expect(screen.getByText("Test Parameter")).toBeInTheDocument();
      expect(screen.getByText("2 table.selection.multiple")).toBeInTheDocument();
    });

    it("should handle implicit filter button click to remove implicit filter", () => {
      const propsWithImplicitFilter = {
        ...mockProps,
        initialIsFilterApplied: true,
        isImplicitFilterApplied: true,
      };

      render(<GridTopToolbar {...propsWithImplicitFilter} />);

      const filterButton = screen.getByTestId("implicit-filter-button");
      fireEvent.click(filterButton);

      expect(mockProps.setIsImplicitFilterApplied).toHaveBeenCalledWith(false);
    });

    it("should disable the implicit filter button when implicit filter is not applied", () => {
      const propsWithoutImplicitFilter = {
        ...mockProps,
        initialIsFilterApplied: true,
        isImplicitFilterApplied: false,
      };

      render(<GridTopToolbar {...propsWithoutImplicitFilter} />);

      const filterButton = screen.getByTestId("implicit-filter-button");
      expect(filterButton).toBeDisabled();
    });

    it("should call handleClearSelections when clear button is clicked", () => {
      render(<GridTopToolbar {...mockProps} />);

      const clearButton = screen.getByText("common.clear");
      fireEvent.click(clearButton);

      expect(mockProps.handleClearSelections).toHaveBeenCalled();
    });
  });
});

describe("syncGridSelectionToLocalRecords", () => {
  const makeRecord = (overrides?: Partial<EntityData>): EntityData =>
    ({ id: "1", amount: 0, paymentAmount: 0, obSelected: false, ...overrides }) as EntityData;

  it("calls setLocalRecords when a matching selection updates a record", () => {
    const setLocalRecords = jest.fn();
    const localRecords = [makeRecord({ id: "1", amount: 0 })];
    const externalSelection = [{ id: "1", amount: 50 }];
    syncGridSelectionToLocalRecords(externalSelection, localRecords, setLocalRecords);
    expect(setLocalRecords).toHaveBeenCalledTimes(1);
    const updated = setLocalRecords.mock.calls[0][0] as EntityData[];
    expect(updated[0].amount).toBe(50);
  });

  it("resets amount and paymentAmount for records not present in externalSelection", () => {
    const setLocalRecords = jest.fn();
    const localRecords = [makeRecord({ id: "2", amount: 100, paymentAmount: 20 })];
    syncGridSelectionToLocalRecords([], localRecords, setLocalRecords);
    expect(setLocalRecords).toHaveBeenCalledTimes(1);
    const updated = setLocalRecords.mock.calls[0][0] as EntityData[];
    expect(updated[0].amount).toBe(0);
    expect(updated[0].paymentAmount).toBe(0);
  });

  it("does not call setLocalRecords when nothing changed", () => {
    const setLocalRecords = jest.fn();
    // Record already at default zeroed values — resetLocalRecordFields returns null (no change)
    const localRecords = [makeRecord({ id: "1", amount: 0, paymentAmount: 0, obSelected: false })];
    syncGridSelectionToLocalRecords([], localRecords, setLocalRecords);
    expect(setLocalRecords).not.toHaveBeenCalled();
  });

  it("handles empty localRecords without calling setLocalRecords", () => {
    const setLocalRecords = jest.fn();
    syncGridSelectionToLocalRecords([{ id: "1", amount: 10 }], [], setLocalRecords);
    expect(setLocalRecords).not.toHaveBeenCalled();
  });

  it("updates only the matching record and leaves others unchanged", () => {
    const setLocalRecords = jest.fn();
    const localRecords = [
      makeRecord({ id: "1", amount: 0 }),
      makeRecord({ id: "2", amount: 99, paymentAmount: 5, obSelected: true }),
    ];
    const externalSelection = [{ id: "1", amount: 30 }];
    syncGridSelectionToLocalRecords(externalSelection, localRecords, setLocalRecords);
    expect(setLocalRecords).toHaveBeenCalledTimes(1);
    const updated = setLocalRecords.mock.calls[0][0] as EntityData[];
    expect(updated[0].amount).toBe(30);
    // record id=2 not in selection → reset amount/paymentAmount
    expect(updated[1].amount).toBe(0);
    expect(updated[1].paymentAmount).toBe(0);
  });

  it("keeps a read-only amount on unselected rows while zeroing the editable field", () => {
    const setLocalRecords = jest.fn();
    const localRecords = [makeRecord({ id: "2", amount: 100, paymentAmount: 20 })];
    const isFieldReadOnly = (fieldName: string) => fieldName === "amount";
    syncGridSelectionToLocalRecords([], localRecords, setLocalRecords, isFieldReadOnly);
    expect(setLocalRecords).toHaveBeenCalledTimes(1);
    const updated = setLocalRecords.mock.calls[0][0] as EntityData[];
    expect(updated[0].amount).toBe(100); // read-only invoice amount preserved
    expect(updated[0].paymentAmount).toBe(0); // editable field still zeroed
  });
});

describe("syncPersistentSelection", () => {
  const makeRecord = (overrides?: Partial<EntityData>): EntityData =>
    ({ id: "1", ...overrides }) as EntityData;

  it("sets selected rows and ignores unselected ones", () => {
    const cache = new Map<string, EntityData>();
    const r1 = makeRecord({ id: "1" });
    const r2 = makeRecord({ id: "2" });
    syncPersistentSelection(cache, [r1, r2], { "1": true });
    expect(Array.from(cache.keys())).toEqual(["1"]);
    expect(cache.get("1")).toBe(r1);
    expect(cache.has("2")).toBe(false);
  });

  it("deletes a previously cached row when it is re-synced as unselected", () => {
    const cache = new Map<string, EntityData>();
    const r1 = makeRecord({ id: "1" });
    const r2 = makeRecord({ id: "2" });
    syncPersistentSelection(cache, [r1, r2], { "1": true });
    syncPersistentSelection(cache, [r1, r2], { "2": true });
    expect(cache.has("1")).toBe(false);
    expect(cache.get("2")).toBe(r2);
  });

  it("empties the cache when nothing is selected", () => {
    const cache = new Map<string, EntityData>();
    const r1 = makeRecord({ id: "1" });
    syncPersistentSelection(cache, [r1], { "1": true });
    syncPersistentSelection(cache, [r1], {});
    expect(cache.size).toBe(0);
  });

  it("keys the cache by String(record.id) for non-string ids", () => {
    const cache = new Map<string, EntityData>();
    const record = makeRecord({ id: 7 as unknown as string });
    syncPersistentSelection(cache, [record], { "7": true });
    expect(cache.get("7")).toBe(record);
  });
});

describe("buildIsFieldReadOnly", () => {
  it("returns true only for fields flagged read-only in the map", () => {
    const isFieldReadOnly = buildIsFieldReadOnly({ amount: true, paymentAmount: false });
    expect(isFieldReadOnly("amount")).toBe(true);
    expect(isFieldReadOnly("paymentAmount")).toBe(false);
    expect(isFieldReadOnly("unknown")).toBe(false);
  });

  it("treats every field as editable when the map is missing or empty", () => {
    expect(buildIsFieldReadOnly(undefined)("amount")).toBe(false);
    expect(buildIsFieldReadOnly({})("amount")).toBe(false);
  });
});

describe("findMatchingRecord", () => {
  it("returns undefined for an empty array", () => {
    expect(findMatchingRecord([], "id1", undefined)).toBeUndefined();
  });

  it("returns undefined for null/undefined rawRecords", () => {
    expect(findMatchingRecord(null as unknown as never[], "id1", undefined)).toBeUndefined();
    expect(findMatchingRecord(undefined as unknown as never[], "id1", undefined)).toBeUndefined();
  });

  it("matches by r.id", () => {
    const records = [{ id: "abc" }, { id: "xyz" }];
    expect(findMatchingRecord(records, "abc", undefined)).toEqual({ id: "abc" });
  });

  it("matches by r.order", () => {
    const records = [{ id: "1", order: "ORD-001" }];
    expect(findMatchingRecord(records, "ORD-001", undefined)).toEqual({ id: "1", order: "ORD-001" });
  });

  it("matches by r.c_order_id._identifier (edge case)", () => {
    const records = [{ id: "1", c_order_id: { _identifier: "SO-999" } }];
    expect(findMatchingRecord(records, "SO-999", undefined)).toBeDefined();
  });

  it("matches by r.documentNo when contextDocNo is provided", () => {
    const records = [{ id: "1", documentNo: "DOC-42" }];
    expect(findMatchingRecord(records, undefined, "DOC-42")).toEqual({ id: "1", documentNo: "DOC-42" });
  });

  it("returns undefined when neither parentContextId nor contextDocNo match any record", () => {
    const records = [{ id: "1", documentNo: "DOC-1" }];
    expect(findMatchingRecord(records, "NOPE", "NOPE")).toBeUndefined();
  });
});

describe("isFieldVisibleForContext", () => {
  // Server-rewritten expression that mirrors what classic UI produces via
  // `DimensionDisplayUtility.computeAccountingDimensionDisplayLogic` for a
  // BPartner field on an APP/Lines tab: visible when either the legacy
  // `$Element_BP` is "Y" (decentralized config) or the per-doctype-level
  // `$Element_BP_<DOCBASETYPE>_L` is "Y" (centralized config).
  const KEY_CENTRALLY = "$IsAcctDimCentrally";
  const KEY_BP_LEGACY = "$Element_BP";
  const KEY_BP_APP_L = "$Element_BP_APP_L";
  const BP_REWRITTEN_EXPR =
    "(context.$IsAcctDimCentrally === 'N' && context.$Element_BP === 'Y') || " +
    "(context.$IsAcctDimCentrally === 'Y' && context['$Element_BP_' + OB.Utilities.getValue(currentValues, \"DOCBASETYPE\") + '_L'] === 'Y')";

  const baseField = {
    name: "BPartner",
    isActive: true,
    displayed: true,
    showInGridView: true,
  };

  it("returns false when isActive is false", () => {
    expect(isFieldVisibleForContext({ ...baseField, isActive: false }, {}, {})).toBe(false);
  });

  it("returns false when displayed is false", () => {
    expect(isFieldVisibleForContext({ ...baseField, displayed: false }, {}, {})).toBe(false);
  });

  it("returns false when showInGridView is false", () => {
    expect(isFieldVisibleForContext({ ...baseField, showInGridView: false }, {}, {})).toBe(false);
  });

  it("returns true when there is no display logic and no grid display logic", () => {
    expect(isFieldVisibleForContext(baseField, {}, {})).toBe(true);
  });

  it("returns false when gridDisplayLogicExpression evaluates to false", () => {
    const field = { ...baseField, gridDisplayLogicExpression: "false" };
    expect(isFieldVisibleForContext(field, {}, {})).toBe(false);
  });

  it("returns true when gridDisplayLogicExpression evaluates to true", () => {
    const field = { ...baseField, gridDisplayLogicExpression: "true" };
    expect(isFieldVisibleForContext(field, {}, {})).toBe(true);
  });

  it("fails open (returns true) when gridDisplayLogicExpression is unparseable", () => {
    const field = { ...baseField, gridDisplayLogicExpression: "this is not valid !!" };
    expect(isFieldVisibleForContext(field, {}, {})).toBe(true);
  });

  it("hides BPartner when centralized mode and per-doctype flag is 'N' (matches classic Product/CostCenter case)", () => {
    const session = {
      [KEY_CENTRALLY]: "Y",
      [KEY_BP_APP_L]: "N",
      [KEY_BP_LEGACY]: "",
    };
    const context = { ...session, DOCBASETYPE: "APP" };
    const field = { ...baseField, gridDisplayLogicExpression: BP_REWRITTEN_EXPR };
    expect(isFieldVisibleForContext(field, session, context)).toBe(false);
  });

  it("shows BPartner when centralized mode and per-doctype flag is 'Y' (matches classic BPartner/Project case)", () => {
    const session = {
      [KEY_CENTRALLY]: "Y",
      [KEY_BP_APP_L]: "Y",
      [KEY_BP_LEGACY]: "",
    };
    const context = { ...session, DOCBASETYPE: "APP" };
    const field = { ...baseField, gridDisplayLogicExpression: BP_REWRITTEN_EXPR };
    expect(isFieldVisibleForContext(field, session, context)).toBe(true);
  });

  it("shows BPartner when decentralized mode and legacy $Element_BP is 'Y'", () => {
    const session = {
      [KEY_CENTRALLY]: "N",
      [KEY_BP_LEGACY]: "Y",
      [KEY_BP_APP_L]: "N",
    };
    const context = { ...session, DOCBASETYPE: "APP" };
    const field = { ...baseField, gridDisplayLogicExpression: BP_REWRITTEN_EXPR };
    expect(isFieldVisibleForContext(field, session, context)).toBe(true);
  });

  it("hides BPartner when decentralized mode and legacy $Element_BP is empty", () => {
    const session = {
      [KEY_CENTRALLY]: "N",
      [KEY_BP_LEGACY]: "",
      [KEY_BP_APP_L]: "Y",
    };
    const context = { ...session, DOCBASETYPE: "APP" };
    const field = { ...baseField, gridDisplayLogicExpression: BP_REWRITTEN_EXPR };
    expect(isFieldVisibleForContext(field, session, context)).toBe(false);
  });

  it("evaluates displayLogicExpression independently of gridDisplayLogicExpression", () => {
    const field = {
      ...baseField,
      displayLogicExpression: "false",
      gridDisplayLogicExpression: "true",
    };
    expect(isFieldVisibleForContext(field, {}, {})).toBe(false);
  });
});
