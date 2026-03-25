// Mock Next.js server dependencies
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

import { render, screen, fireEvent } from "@testing-library/react";
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

    it("should handle filter button click to remove implicit filter", () => {
      render(<GridTopToolbar {...mockProps} />);

      const filterButton = screen.getByTestId("MRT_ToggleFiltersButton__ce8544");
      fireEvent.click(filterButton);

      expect(mockProps.setIsImplicitFilterApplied).toHaveBeenCalledWith(false);
    });

    it("should handle filter button click to clear column filters when implicit filter is not applied", () => {
      const propsWithoutImplicitFilter = {
        ...mockProps,
        isImplicitFilterApplied: false,
      };

      render(<GridTopToolbar {...propsWithoutImplicitFilter} />);

      const filterButton = screen.getByTestId("MRT_ToggleFiltersButton__ce8544");
      fireEvent.click(filterButton);

      expect(mockTable.setColumnFilters).toHaveBeenCalledWith([]);
      expect(mockProps.handleMRTColumnFiltersChange).toHaveBeenCalledWith([]);
    });

    it("should call handleClearSelections when clear button is clicked", () => {
      render(<GridTopToolbar {...mockProps} />);

      const clearButton = screen.getByText("common.clear");
      fireEvent.click(clearButton);

      expect(mockProps.handleClearSelections).toHaveBeenCalled();
    });
  });
});
