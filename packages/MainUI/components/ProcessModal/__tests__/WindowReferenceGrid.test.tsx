// Mock Next.js server dependencies
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

// Stub the heavyweight cell-editor used by the selected/editable branch of
// `GridCellRenderer` so the rendering tests can detect that branch via a
// data-testid probe instead of booting the full editor subtree.
jest.mock("../GridCellEditor", () => ({
  GridCellEditor: () => <div data-testid="probe-grid-cell-editor">editor</div>,
}));

// `StableGridCellEditorRenderer` consumes `useWindowReferenceGridContext`, so
// stub it with a no-op context provider that exposes the validation/error refs
// the renderer reaches into.
jest.mock("../WindowReferenceGridContext", () => ({
  useWindowReferenceGridContext: () => ({
    fieldsRef: { current: [] },
    handleRecordChangeRef: { current: null },
    validations: [],
    createRowErrors: new Set<string>(),
    clearCellError: jest.fn(),
  }),
  WindowReferenceGridProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  extractActualValue,
  mergeDefaultsIntoParams,
  mergeCurrentValuesIntoParams,
  resolveParentContextId,
  applyDynamicKeys,
  buildValidColumnNames,
  applyRecordValues,
  evaluateFieldReadOnlyLogic,
  buildGridCriteria,
  getSortByString,
  GridCellRenderer,
} from "../WindowReferenceGrid";

describe("WindowReferenceGrid Utilities", () => {
  describe("extractActualValue", () => {
    it("extracts value from object with 'value' property", () => {
      expect(extractActualValue({ value: "test" })).toBe("test");
    });

    it("returns the value directly if not an object with 'value' property", () => {
      expect(extractActualValue("test")).toBe("test");
      expect(extractActualValue(123)).toBe(123);
      expect(extractActualValue(null)).toBe(null);
    });
  });

  describe("mergeDefaultsIntoParams", () => {
    it("merges default values into params object", () => {
      const defaults = { a: 1, b: { value: 2 } };
      const mergedParams = {};
      mergeDefaultsIntoParams(defaults, mergedParams);
      expect(mergedParams).toEqual({ a: 1, b: 2 });
    });
  });

  describe("mergeCurrentValuesIntoParams", () => {
    it("merges current values, overriding existing ones", () => {
      const currentValues = { a: 10, b: { value: 20 }, c: null };
      const mergedParams: any = { a: 1, d: 4 };
      mergeCurrentValuesIntoParams(currentValues, mergedParams);
      // null overrides but undefined shouldn't (though implementation only checks for !null/!undefined)
      expect(mergedParams).toEqual({ a: 10, b: 20, d: 4 });
    });
  });

  describe("resolveParentContextId", () => {
    it("resolves parent context ID from multiple potential keys", () => {
      const dbName = "C_Order_ID";
      const recordValues = { C_Order_ID: "12345678901234567890123456789012" };
      const currentValues = {};
      const result = resolveParentContextId(dbName, recordValues, currentValues);
      expect(result.parentContextId).toBe("12345678901234567890123456789012");
    });

    it("resolves document number from context", () => {
      const dbName = "Dummy";
      const recordValues = { inpdocumentno: "DOC001" };
      const result = resolveParentContextId(dbName, recordValues, {});
      expect(result.contextDocNo).toBe("DOC001");
    });
  });

  describe("applyDynamicKeys", () => {
    it("applies org and client keys", () => {
      const recordValues = { inpadOrgId: "ORG1", inpadClientId: "CLIENT1" };
      const options: any = {};
      applyDynamicKeys(recordValues, undefined, options);
      expect(options.ad_org_id).toBe("ORG1");
      expect(options.ad_client_id).toBe("CLIENT1");
    });
  });

  describe("buildValidColumnNames", () => {
    it("builds a set of valid column names from tab fields and prop fields", () => {
      const tabFields = { f1: { columnName: "COL1" } };
      const propFields = [{ name: "PROP1" }];
      const result = buildValidColumnNames(tabFields, propFields);
      expect(result.has("col1")).toBe(true);
      expect(result.has("prop1")).toBe(true);
      expect(result.has("ad_org_id")).toBe(true); // standard key
    });
  });

  describe("applyRecordValues", () => {
    it("applies record values to options if they match valid column names", () => {
      const parameters = { p1: { name: "param1", dBColumnName: "COL1" } };
      const recordValues = { param1: "VAL1" };
      const validColumnNames = new Set(["col1"]);
      const options: any = {};
      applyRecordValues(parameters, recordValues, validColumnNames, options);
      expect(options.COL1).toBe("VAL1");
    });
  });

  describe("evaluateFieldReadOnlyLogic", () => {
    it("returns true for static read-only flags", () => {
      expect(evaluateFieldReadOnlyLogic({ readOnly: true }, {})).toBe(true);
      expect(evaluateFieldReadOnlyLogic({ isReadOnly: true }, {})).toBe(true);
    });
  });

  describe("buildGridCriteria", () => {
    it("returns empty array if no filter expressions", () => {
      expect(buildGridCriteria(undefined, "TEST")).toEqual([]);
    });

    it("builds criteria from filter expressions map", () => {
      const filterExpressions = {
        grid1: { field1: "val1" },
      };
      const result = buildGridCriteria(filterExpressions, "grid1");
      expect(result).toHaveLength(1);
      expect(result[0].fieldName).toBe("field1");
    });
  });

  describe("getSortByString", () => {
    const mockColumns: any[] = [
      { id: "col1", columnName: "COL1", filterFieldName: "field1" },
      { id: "col2", header: "Header2", columnName: "COL2" },
    ];

    it("returns undefined when no sorting and no criteria", () => {
      expect(getSortByString([], mockColumns, false)).toBeUndefined();
    });

    it("returns default -documentNo when has criteria but no sorting", () => {
      expect(getSortByString([], mockColumns, true)).toBe("-documentNo");
    });

    it("returns correctly formatted sorting string for ascending order", () => {
      const sorting = [{ id: "col1", desc: false }];
      expect(getSortByString(sorting, mockColumns, false)).toBe("field1");
    });

    it("returns correctly formatted sorting string for descending order", () => {
      const sorting = [{ id: "col1", desc: true }];
      expect(getSortByString(sorting, mockColumns, false)).toBe("-field1");
    });

    it("uses header as fallback if id doesn't match", () => {
      const sorting = [{ id: "Header2", desc: false }];
      expect(getSortByString(sorting, mockColumns, false)).toBe("COL2");
    });

    it("uses id as fallback if column not found", () => {
      const sorting = [{ id: "Unknown", desc: true }];
      expect(getSortByString(sorting, mockColumns, false)).toBe("-Unknown");
    });
  });

  // -------------------------------------------------------------------------
  // Selection-gated cell rendering (classic-UI parity)
  // -------------------------------------------------------------------------
  // Mirrors the classic P&E grid: a cell whose row is selected renders the
  // editor; otherwise it renders the upstream Cell that `useColumns` installed
  // (color wrappers, reference buttons…), preserved here under `fallbackCell`.
  // glItems rows are always editable because they have no backend id and are
  // mutated locally before the process is submitted.
  describe("GridCellRenderer — selection-gated editability", () => {
    const EDITOR_PROBE_ID = "probe-grid-cell-editor";

    const buildCellRendererProps = ({
      isSelected,
      parameterDBColumnName,
      fallbackCell,
      cellValue = "cell-value",
      columnReference,
      columnType,
      columnName = "amount",
    }: {
      isSelected: boolean;
      parameterDBColumnName?: string;
      fallbackCell?: (props: unknown) => React.ReactElement;
      cellValue?: unknown;
      columnReference?: string;
      columnType?: string;
      columnName?: string;
    }) => ({
      row: {
        getIsSelected: () => isSelected,
        original: { id: "row-1" },
        id: "row-1",
      },
      cell: {
        getValue: () => cellValue,
        column: { id: columnName },
        row: { _valuesCache: {} },
      },
      column: {
        columnDef: {
          parameterDBColumnName,
          fallbackCell,
          columnName,
          type: columnType,
          column: columnReference ? { reference: columnReference } : undefined,
        },
      },
    });

    it("renders the editor probe when the row is selected", () => {
      render(<GridCellRenderer {...buildCellRendererProps({ isSelected: true })} />);
      expect(screen.getByTestId(EDITOR_PROBE_ID)).toBeInTheDocument();
    });

    it("renders the editor probe for glItems rows even without selection", () => {
      render(
        <GridCellRenderer
          {...buildCellRendererProps({ isSelected: false, parameterDBColumnName: "glitem" })}
        />
      );
      expect(screen.getByTestId(EDITOR_PROBE_ID)).toBeInTheDocument();
    });

    it("delegates to fallbackCell on an unselected row of a non-glitem grid", () => {
      // Pins the fix for the Order/Invoices P&E grid: when the row is not
      // selected, the cell must render via the upstream `useColumns` wrapper
      // (preserved as `fallbackCell`), not via the editor.
      const fallbackCell = jest.fn(() => <span data-testid="probe-fallback">fb</span>);
      render(
        <GridCellRenderer
          {...buildCellRendererProps({
            isSelected: false,
            parameterDBColumnName: "order_invoice",
            fallbackCell,
          })}
        />
      );
      expect(screen.getByTestId("probe-fallback")).toBeInTheDocument();
      expect(screen.queryByTestId(EDITOR_PROBE_ID)).toBeNull();
      expect(fallbackCell).toHaveBeenCalledTimes(1);
    });

    it("falls back to the plain InteractiveGridCellRenderer when no fallbackCell is provided", () => {
      // No fallbackCell + no selection + no date column → must still render
      // something usable (the cell value); this guards against blank cells in
      // edge cases like custom columns without a useColumns-installed Cell.
      render(
        <GridCellRenderer
          {...buildCellRendererProps({
            isSelected: false,
            parameterDBColumnName: "order_invoice",
            cellValue: "raw-text",
          })}
        />
      );
      expect(screen.getByText("raw-text")).toBeInTheDocument();
      expect(screen.queryByTestId(EDITOR_PROBE_ID)).toBeNull();
    });

    it("renders date columns through the date branch (no editor) when unselected", () => {
      // Date columns (reference 15 / 16) have a dedicated branch before the
      // fallback path; verify it still wins so an unselected date cell does
      // NOT escalate to the editor and produces a non-empty span. The exact
      // formatted string is owned by `formatClassicDate` and out of scope here.
      const { container } = render(
        <GridCellRenderer
          {...buildCellRendererProps({
            isSelected: false,
            parameterDBColumnName: "order_invoice",
            columnReference: "15",
            cellValue: "2026-05-14",
            columnName: "expectedDate",
          })}
        />
      );
      expect(screen.queryByTestId(EDITOR_PROBE_ID)).toBeNull();
      const span = container.querySelector("span");
      expect(span).not.toBeNull();
      expect(span?.textContent?.length ?? 0).toBeGreaterThan(0);
    });

    it("switches from fallback to editor when selection flips on re-render", () => {
      const fallbackCell = jest.fn(() => <span data-testid="probe-fallback">fb</span>);
      const { rerender } = render(
        <GridCellRenderer
          {...buildCellRendererProps({
            isSelected: false,
            parameterDBColumnName: "order_invoice",
            fallbackCell,
          })}
        />
      );
      expect(screen.getByTestId("probe-fallback")).toBeInTheDocument();

      rerender(
        <GridCellRenderer
          {...buildCellRendererProps({
            isSelected: true,
            parameterDBColumnName: "order_invoice",
            fallbackCell,
          })}
        />
      );
      expect(screen.getByTestId(EDITOR_PROBE_ID)).toBeInTheDocument();
      expect(screen.queryByTestId("probe-fallback")).toBeNull();
    });
  });
});
