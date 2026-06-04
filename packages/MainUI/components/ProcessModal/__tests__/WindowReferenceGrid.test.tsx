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
const mockContextValue: {
  fieldsRef: { current: any[] };
  handleRecordChangeRef: { current: any };
  validations: any[];
  createRowErrors: Set<string>;
  clearCellError: jest.Mock;
  siblingPatchVersion: number;
} = {
  fieldsRef: { current: [] },
  handleRecordChangeRef: { current: null },
  validations: [],
  createRowErrors: new Set<string>(),
  clearCellError: jest.fn(),
  siblingPatchVersion: 0,
};

jest.mock("../WindowReferenceGridContext", () => ({
  useWindowReferenceGridContext: () => mockContextValue,
  WindowReferenceGridProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// MRT_EditActionButtons needs the MaterialReactTable internals to mount. We
// only care about the *presence* of the chrome vs our custom buttons, so we
// stub it with a probe.
jest.mock("material-react-table", () => {
  const actual = jest.requireActual("material-react-table");
  return {
    ...actual,
    MRT_EditActionButtons: () => <div data-testid="probe-mrt-edit-chrome">chrome</div>,
  };
});

import type React from "react";
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
  shouldRenderCellEditor,
  renderActionsCell,
  isPersistedRow,
  isValidHqlName,
  resolveHqlName,
  createEmbeddedGridController,
  type EmbeddedGridApi,
} from "../WindowReferenceGrid";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

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
  // HQL property name fallback (Add Payment / GL Items regression)
  // -------------------------------------------------------------------------
  // The classic UI sends `_allRows[i].gLItem` (HQL property name). The new UI
  // metadata exposes that name as the entry key of `tab.fields["gLItem"]`,
  // never on the field object itself. Without falling back to that key, the
  // dual-key cell writer produces broken keys like `g/LItem` and the backend
  // reads null → "id to load is required for loading".
  describe("isValidHqlName + resolveHqlName — wiring exposed from WindowReferenceGrid", () => {
    it("rejects display labels and DB columns (slashes, spaces, dots, underscores)", () => {
      expect(isValidHqlName("g/LItem")).toBe(false);
      expect(isValidHqlName("G/L Item")).toBe(false);
      expect(isValidHqlName("orderNo.")).toBe(false);
      expect(isValidHqlName("c_glitem_id")).toBe(false);
      expect(isValidHqlName("received_in")).toBe(false);
    });

    it("accepts canonical HQL camelCase identifiers", () => {
      expect(isValidHqlName("gLItem")).toBe(true);
      expect(isValidHqlName("paidOut")).toBe(true);
      expect(isValidHqlName("receivedIn")).toBe(true);
    });

    it("prefers the metadata key over a broken hqlName carrying the display label", () => {
      // Real shape from add-payment metadata: backend ships hqlName="g/LItem"
      // and columnName="c_glitem_id" but the entry key IS "gLItem".
      const field = { name: "G/L Item", hqlName: "g/LItem", columnName: "c_glitem_id" };
      expect(resolveHqlName(field, "gLItem")).toBe("gLItem");
    });

    it("prefers the metadata key over a DB columnName like 'received_in'", () => {
      // Real shape from glitem.receivedIn: hqlName matches the key already, but
      // columnName is the DB snake_case. The resolver must NOT pick it.
      const field = { hqlName: "receivedIn", columnName: "received_in" };
      expect(resolveHqlName(field, "receivedIn")).toBe("receivedIn");
    });

    it("prefers the metadata key over a dotted hqlName (FK navigation path)", () => {
      // Real shape from order_invoice.salesOrderNo: hqlName="orderNo." but key
      // is "salesOrderNo".
      const field = { hqlName: "orderNo.", columnName: "salesOrderNo" };
      expect(resolveHqlName(field, "salesOrderNo")).toBe("salesOrderNo");
    });
  });

  // -------------------------------------------------------------------------
  // Selection-gated cell rendering (classic-UI parity)
  // -------------------------------------------------------------------------
  // Mirrors the classic P&E grid: a cell whose row is selected renders the
  // editor; otherwise it renders the upstream Cell that `useColumns` installed
  // (color wrappers, reference buttons…), preserved here under `fallbackCell`.
  // Confirmed rows (in localRecords) are read-only even when selected; only
  // the MRT creating-row scaffold shows editors for new rows.
  describe("GridCellRenderer — selection-gated editability", () => {
    const EDITOR_PROBE_ID = "probe-grid-cell-editor";

    const buildCellRendererProps = ({
      isSelected,
      locallyAdded = false,
      parameterDBColumnName,
      fallbackCell,
      cellValue = "cell-value",
      columnReference,
      columnType,
      columnName = "amount",
    }: {
      isSelected: boolean;
      locallyAdded?: boolean;
      parameterDBColumnName?: string;
      fallbackCell?: (props: unknown) => React.ReactElement;
      cellValue?: unknown;
      columnReference?: string;
      columnType?: string;
      columnName?: string;
    }) => ({
      row: {
        getIsSelected: () => isSelected,
        original: { id: "row-1", ...(locallyAdded ? { _locallyAdded: true } : {}) },
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

    it("renders the editor probe when the row is selected and not locally added", () => {
      render(<GridCellRenderer {...buildCellRendererProps({ isSelected: true, locallyAdded: false })} />);
      expect(screen.getByTestId(EDITOR_PROBE_ID)).toBeInTheDocument();
    });

    it("does not render the editor for a selected locally-added row (confirmed rows are read-only)", () => {
      const fallbackCell = jest.fn(() => <span data-testid="probe-fallback">fb</span>);
      render(<GridCellRenderer {...buildCellRendererProps({ isSelected: true, locallyAdded: true, fallbackCell })} />);
      expect(screen.queryByTestId(EDITOR_PROBE_ID)).toBeNull();
      expect(screen.getByTestId("probe-fallback")).toBeInTheDocument();
    });

    it("delegates to fallbackCell on any unselected row", () => {
      // All P&E grids: when the row is not selected, the cell must render via
      // the upstream `useColumns` wrapper (preserved as `fallbackCell`), not via
      // the editor.
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

  // Pure decision function: selection is the only gate that mounts the editor;
  // read-only fields and locally-added rows always render as inert.
  describe("shouldRenderCellEditor", () => {
    it.each<[string, { isSelected: boolean; isFieldReadOnly: boolean; isLocallyAdded: boolean }, boolean]>([
      [
        "selected, not read-only, not locally-added → editor",
        { isSelected: true, isFieldReadOnly: false, isLocallyAdded: false },
        true,
      ],
      [
        "selected, locally-added → inert (post-'+' rows are confirmed)",
        { isSelected: true, isFieldReadOnly: false, isLocallyAdded: true },
        false,
      ],
      ["selected, read-only field → inert", { isSelected: true, isFieldReadOnly: true, isLocallyAdded: false }, false],
      [
        "not selected → inert (no selection-based editing)",
        { isSelected: false, isFieldReadOnly: false, isLocallyAdded: false },
        false,
      ],
      [
        "not selected, locally-added → inert",
        { isSelected: false, isFieldReadOnly: false, isLocallyAdded: true },
        false,
      ],
    ])("%s", (_label, args, expected) => {
      expect(shouldRenderCellEditor(args.isSelected, args.isFieldReadOnly, args.isLocallyAdded)).toBe(expected);
    });
  });

  // Row-actions cell: two branches (creating, idle) and the cross-disabling
  // contract that locks "one row at a time".
  describe("renderActionsCell", () => {
    const DELETE_LABEL = "Delete row";
    const ROW_ID = "row-1";

    const buildArgs = ({
      rowId = ROW_ID,
      hasId = true,
      creatingRowId = null,
      canDelete = true,
    }: {
      rowId?: string;
      hasId?: boolean;
      creatingRowId?: string | null;
      canDelete?: boolean;
    } = {}) => {
      const onDelete = jest.fn();
      const args = {
        row: { id: rowId, original: hasId ? { id: rowId } : {} },
        table: {
          getState: () => ({
            creatingRow: creatingRowId ? { id: creatingRowId } : null,
          }),
        },
        canDelete,
        onDelete,
        deleteRowLabel: DELETE_LABEL,
      };
      return { args, onDelete };
    };

    it("renders an enabled trash button when idle and canDelete is on", () => {
      const { args, onDelete } = buildArgs();
      render(renderActionsCell(args) as React.ReactElement);
      const deleteBtn = screen.getByTestId("WindowReferenceGrid__DeleteRowButton");
      expect(deleteBtn).not.toBeDisabled();
      deleteBtn.click();
      expect(onDelete).toHaveBeenCalledWith(args.row);
    });

    it("disables trash while another row is being created", () => {
      const { args } = buildArgs({ creatingRowId: "other-creating" });
      render(renderActionsCell(args) as React.ReactElement);
      expect(screen.getByTestId("WindowReferenceGrid__DeleteRowButton")).toBeDisabled();
    });

    it("renders no trash button when canDelete is false", () => {
      const { args } = buildArgs({ canDelete: false });
      const { container } = render(renderActionsCell(args) as React.ReactElement);
      expect(screen.queryByTestId("WindowReferenceGrid__DeleteRowButton")).toBeNull();
      expect(container.querySelector("button")).toBeNull();
    });

    it("defers to MRT's edit chrome for the creating-row scaffold (no row.original.id)", () => {
      const { args } = buildArgs({ hasId: false });
      render(renderActionsCell(args) as React.ReactElement);
      // MRT_EditActionButtons is the chrome — not our custom trash button.
      expect(screen.queryByTestId("WindowReferenceGrid__DeleteRowButton")).toBeNull();
      expect(screen.getByTestId("probe-mrt-edit-chrome")).toBeInTheDocument();
    });
  });

  // Guard composes with `editDisplayMode: "row"` to block any vector that
  // could put a persisted row into MRT edit-mode (double-click cell-edit,
  // keyboard shortcuts, external setEditingRow). Only the active create-row
  // (no `original.id`) must be allowed in.
  describe("isPersistedRow", () => {
    it.each<[string, unknown, boolean]>([
      ["row with original.id (remote record)", { original: { id: "REC-1" } }, true],
      [
        "row with original.id from locally-added '+' flow",
        { original: { id: "local-uuid", _locallyAdded: true } },
        true,
      ],
      ["create-row scaffold (original = {})", { original: {} }, false],
      ["row with original = null", { original: null }, false],
      ["row with no original key", {}, false],
      ["null/undefined row", null, false],
    ])("%s → %s", (_label, row, expected) => {
      expect(isPersistedRow(row)).toBe(expected);
    });
  });

  describe("createEmbeddedGridController", () => {
    const rec = (id: string, extra: Record<string, unknown> = {}): EntityData => ({ id, ...extra }) as EntityData;

    const makeApi = (over: Partial<EmbeddedGridApi> = {}) => {
      const api: EmbeddedGridApi = {
        rows: [rec("1", { amount: 5 }), rec("2", { amount: 7 })],
        refetch: jest.fn(),
        criteria: { operator: "and" },
        fields: [{ columnName: "amount_col", hqlName: "amount" }] as unknown as EmbeddedGridApi["fields"],
        handleRowSelection: jest.fn(),
        handleClearSelections: jest.fn(),
        handleRecordChange: jest.fn(),
        ...over,
      };
      return api;
    };

    it("reads rows, edited cells and total live from the api getter", () => {
      const api = makeApi();
      const controller = createEmbeddedGridController(
        () => api,
        () => [rec("2")],
        [],
        []
      );
      expect(controller.getTotalRows()).toBe(2);
      expect(controller.getRecord(0)).toEqual(rec("1", { amount: 5 }));
      expect(controller.getRecordIndex(rec("2"))).toBe(1);
      expect(controller.getSelectedRecords()).toEqual([rec("2")]);
      expect(controller.getEditedCell(1, "amount")).toBe(7);
      expect(controller.getFieldByColumnName("amount_col")).toEqual({ columnName: "amount_col", hqlName: "amount" });
    });

    it("routes selection and edit through the grid's own handlers", () => {
      const api = makeApi();
      const controller = createEmbeddedGridController(
        () => api,
        () => [],
        [],
        []
      );
      controller.setEditValue(0, "amount", 99);
      expect(api.handleRecordChange).toHaveBeenCalledWith(rec("1", { amount: 5 }), { amount: 99 });

      controller.selectRecord(1);
      const updater = (api.handleRowSelection as jest.Mock).mock.calls[0][0];
      expect(updater({})).toEqual({ "2": true });

      controller.deselectAllRecords();
      expect(api.handleClearSelections).toHaveBeenCalled();

      controller.invalidateCache();
      expect(api.refetch).toHaveBeenCalled();
    });

    it("builds id criteria from the live selection and chains lifecycle subscribers", () => {
      const api = makeApi();
      const dataArrivedSubs: Array<(rows: EntityData[]) => void> = [];
      const controller = createEmbeddedGridController(
        () => api,
        () => [rec("a"), rec("b")],
        dataArrivedSubs,
        []
      );
      const merged = controller.addSelectedIDsToCriteria({ operator: "and" }, true) as {
        criteria: Array<Record<string, unknown>>;
      };
      expect(merged.criteria).toEqual([{ fieldName: "id", operator: "inSet", value: ["a", "b"] }]);

      const sub = jest.fn();
      controller.onDataArrived(sub);
      controller.onDataArrived(sub); // de-duped by reference
      expect(dataArrivedSubs).toEqual([sub]);
    });
  });
});
