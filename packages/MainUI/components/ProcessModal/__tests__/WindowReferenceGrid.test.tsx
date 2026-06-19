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
  CreateRowActionButtons,
  collectEditInputValues,
  shouldShowRowActions,
  isPersistedRow,
  isValidHqlName,
  resolveHqlName,
  createEmbeddedGridController,
  RowActionsCell,
  type EmbeddedGridApi,
} from "../WindowReferenceGrid";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { RowActionButton } from "@/utils/processes/definition/scriptProxies";

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
  const CREATE_ROW_CANCEL_TESTID = "WindowReferenceGrid__CreateRowCancelButton";
  const CREATE_ROW_SAVE_TESTID = "WindowReferenceGrid__CreateRowSaveButton";

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
        // Minimal MRT table stub covering both branches: `creatingRow` for the
        // idle/trash logic and the options/refs the create-row buttons consume.
        table: {
          getState: () => ({
            creatingRow: creatingRowId ? { id: creatingRowId } : null,
            isSaving: false,
          }),
          setCreatingRow: jest.fn(),
          options: {
            onCreatingRowSave: jest.fn(),
            onCreatingRowCancel: jest.fn(),
            localization: { cancel: "Cancel", save: "Save" },
          },
          refs: { editInputRefs: { current: {} } },
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

    it("renders our custom Add/Cancel buttons for the creating-row scaffold (no row.original.id)", () => {
      const { args } = buildArgs({ hasId: false });
      render(renderActionsCell(args) as React.ReactElement);
      // Our own create-row chrome — not the trash button.
      expect(screen.queryByTestId("WindowReferenceGrid__DeleteRowButton")).toBeNull();
      expect(screen.getByTestId(CREATE_ROW_CANCEL_TESTID)).toBeInTheDocument();
      expect(screen.getByTestId(CREATE_ROW_SAVE_TESTID)).toBeInTheDocument();
    });

    it("renders leading script actions before the delete button on an idle row", () => {
      const { args } = buildArgs();
      render(
        renderActionsCell({
          ...args,
          leadingActions: <button type="button" data-testid="leading-probe" />,
        }) as React.ReactElement
      );
      expect(screen.getByTestId("leading-probe")).toBeInTheDocument();
      expect(screen.getByTestId("WindowReferenceGrid__DeleteRowButton")).toBeInTheDocument();
    });

    it("ignores leadingActions on the creating-row scaffold (create-row chrome only)", () => {
      const { args } = buildArgs({ hasId: false });
      render(
        renderActionsCell({
          ...args,
          leadingActions: <button type="button" data-testid="leading-probe" />,
        }) as React.ReactElement
      );
      expect(screen.queryByTestId("leading-probe")).toBeNull();
      expect(screen.getByTestId(CREATE_ROW_SAVE_TESTID)).toBeInTheDocument();
    });

    it("renders leading script actions even when the row is not deletable", () => {
      const { args } = buildArgs({ canDelete: false });
      render(
        renderActionsCell({
          ...args,
          leadingActions: <button type="button" data-testid="leading-probe" />,
        }) as React.ReactElement
      );
      expect(screen.getByTestId("leading-probe")).toBeInTheDocument();
      expect(screen.queryByTestId("WindowReferenceGrid__DeleteRowButton")).toBeNull();
    });
  });

  describe("collectEditInputValues", () => {
    const ROW_ID = "row-1";

    const buildTable = (current: Record<string, { name: string; value: unknown }>) => ({
      refs: { editInputRefs: { current } },
    });

    it("copies matching inputs (by row id) into the value cache", () => {
      const row = { id: ROW_ID, _valuesCache: { [`${ROW_ID}_amount`]: "", [`${ROW_ID}_qty`]: "" } };
      const table = buildTable({
        a: { name: `${ROW_ID}_amount`, value: "100" },
        b: { name: `${ROW_ID}_qty`, value: "5" },
      });

      const result = collectEditInputValues(row, table);

      expect(result).toEqual({ [`${ROW_ID}_amount`]: "100", [`${ROW_ID}_qty`]: "5" });
    });

    it("ignores inputs that belong to another row", () => {
      const row = { id: ROW_ID, _valuesCache: { [`${ROW_ID}_amount`]: "" } };
      const table = buildTable({ a: { name: "other-row_amount", value: "999" } });

      const result = collectEditInputValues(row, table);

      expect(result).toEqual({ [`${ROW_ID}_amount`]: "" });
    });

    it("ignores input names absent from the value cache", () => {
      const row = { id: ROW_ID, _valuesCache: { [`${ROW_ID}_amount`]: "" } };
      const table = buildTable({ a: { name: `${ROW_ID}_unknown`, value: "x" } });

      const result = collectEditInputValues(row, table);

      expect(result).toEqual({ [`${ROW_ID}_amount`]: "" });
    });

    it("returns an empty object when the row has no value cache and no refs", () => {
      expect(collectEditInputValues({ id: ROW_ID }, {})).toEqual({});
    });
  });

  describe("CreateRowActionButtons", () => {
    const ROW_ID = "row-1";
    const CANCEL_LABEL = "Cancel";
    const SAVE_LABEL = "Save";

    const buildTable = ({
      isSaving = false,
      withSave = true,
      editInputs = {},
    }: {
      isSaving?: boolean;
      withSave?: boolean;
      editInputs?: Record<string, { name: string; value: unknown }>;
    } = {}) => {
      const onCreatingRowSave = jest.fn();
      const onCreatingRowCancel = jest.fn();
      const setCreatingRow = jest.fn();
      const table = {
        getState: () => ({ isSaving }),
        setCreatingRow,
        options: {
          onCreatingRowSave: withSave ? onCreatingRowSave : undefined,
          onCreatingRowCancel,
          localization: { cancel: CANCEL_LABEL, save: SAVE_LABEL },
        },
        refs: { editInputRefs: { current: editInputs } },
      };
      return { table, onCreatingRowSave, onCreatingRowCancel, setCreatingRow };
    };

    const buildRow = (valuesCache: Record<string, unknown> = {}) => ({ id: ROW_ID, _valuesCache: valuesCache });

    it("renders both Cancel and Save buttons with the localized labels", () => {
      const { table } = buildTable();
      render(<CreateRowActionButtons row={buildRow()} table={table} />);
      expect(screen.getByTestId(CREATE_ROW_CANCEL_TESTID)).toHaveAttribute("aria-label", CANCEL_LABEL);
      expect(screen.getByTestId(CREATE_ROW_SAVE_TESTID)).toHaveAttribute("aria-label", SAVE_LABEL);
    });

    it("does not render Save when no onCreatingRowSave is provided", () => {
      const { table } = buildTable({ withSave: false });
      render(<CreateRowActionButtons row={buildRow()} table={table} />);
      expect(screen.getByTestId(CREATE_ROW_CANCEL_TESTID)).toBeInTheDocument();
      expect(screen.queryByTestId(CREATE_ROW_SAVE_TESTID)).toBeNull();
    });

    it("disables Save while the table is saving", () => {
      const { table } = buildTable({ isSaving: true });
      render(<CreateRowActionButtons row={buildRow()} table={table} />);
      expect(screen.getByTestId(CREATE_ROW_SAVE_TESTID)).toBeDisabled();
    });

    it("Save flushes the edit inputs and calls onCreatingRowSave with an exitCreatingMode that clears the row", () => {
      const { table, onCreatingRowSave, setCreatingRow } = buildTable({
        editInputs: { a: { name: `${ROW_ID}_amount`, value: "42" } },
      });
      const row = buildRow({ [`${ROW_ID}_amount`]: "" });
      render(<CreateRowActionButtons row={row} table={table} />);

      screen.getByTestId(CREATE_ROW_SAVE_TESTID).click();

      expect(onCreatingRowSave).toHaveBeenCalledTimes(1);
      const callArg = onCreatingRowSave.mock.calls[0][0];
      expect(callArg.row).toBe(row);
      expect(callArg.table).toBe(table);
      expect(callArg.values).toEqual({ [`${ROW_ID}_amount`]: "42" });
      callArg.exitCreatingMode();
      expect(setCreatingRow).toHaveBeenCalledWith(null);
    });

    it("Cancel calls onCreatingRowCancel, clears the creating row and resets the value cache", () => {
      const { table, onCreatingRowCancel, setCreatingRow } = buildTable();
      const row = buildRow({ [`${ROW_ID}_amount`]: "42" });
      render(<CreateRowActionButtons row={row} table={table} />);

      screen.getByTestId(CREATE_ROW_CANCEL_TESTID).click();

      expect(onCreatingRowCancel).toHaveBeenCalledWith({ row, table });
      expect(setCreatingRow).toHaveBeenCalledWith(null);
      expect(row._valuesCache).toEqual({});
    });

    it("stops click propagation so the row selection is not toggled", () => {
      const { table } = buildTable();
      const onParentClick = jest.fn();
      render(
        // biome-ignore lint/a11y/useKeyWithClickEvents: test-only wrapper to assert propagation
        <div onClick={onParentClick}>
          <CreateRowActionButtons row={buildRow()} table={table} />
        </div>
      );

      screen.getByTestId(CREATE_ROW_CANCEL_TESTID).click();
      screen.getByTestId(CREATE_ROW_SAVE_TESTID).click();

      expect(onParentClick).not.toHaveBeenCalled();
    });
  });

  describe("shouldShowRowActions", () => {
    it("is true when the grid is creatable (canAdd) even with no actionable rows or script actions", () => {
      expect(shouldShowRowActions(false, false, true)).toBe(true);
    });

    it("is true when a row is actionable (deletable/locally-added)", () => {
      expect(shouldShowRowActions(true, false, false)).toBe(true);
    });

    it("is true when script row actions are registered", () => {
      expect(shouldShowRowActions(false, true, false)).toBe(true);
    });

    it("is false only when none apply", () => {
      expect(shouldShowRowActions(false, false, false)).toBe(false);
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
        setRowActions: jest.fn(),
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
      // setEditValue is the script (programmatic) path: it flags the write so the
      // cell validator gate is skipped (classic never validates programmatic writes).
      expect(api.handleRecordChange).toHaveBeenCalledWith(rec("1", { amount: 5 }), { amount: 99 }, { programmatic: true });

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

    it("delegates setRowActions to the grid's own registration handler", () => {
      const api = makeApi();
      const controller = createEmbeddedGridController(
        () => api,
        () => [],
        [],
        []
      );
      const renderer = jest.fn();
      controller.setRowActions(renderer);
      expect(api.setRowActions).toHaveBeenCalledWith(renderer);
    });
  });

  describe("RowActionsCell", () => {
    const ROW_ACTION_BUTTON = "WindowReferenceGrid__RowActionButton";
    const SEARCH_LABEL = "Search";

    const buttons = (...items: RowActionButton[]) => items;

    it("renders one button per declarative entry with prompts as accessible labels", () => {
      const onActivate = jest.fn();
      render(
        <RowActionsCell
          buttons={buttons(
            { icon: "search", prompt: SEARCH_LABEL, action: jest.fn() },
            { icon: "add", prompt: "Add", action: jest.fn() },
            { icon: "clearRight", prompt: "Clear", action: jest.fn() }
          )}
          onActivate={onActivate}
        />
      );
      const renderedButtons = screen.getAllByTestId(ROW_ACTION_BUTTON);
      expect(renderedButtons).toHaveLength(3);
      expect(renderedButtons[0]).toHaveAttribute("aria-label", SEARCH_LABEL);
    });

    it("calls onActivate with the button index and stops the row-click from firing", () => {
      const onActivate = jest.fn();
      const onRowClick = jest.fn();
      render(
        // biome-ignore lint/a11y/useKeyWithClickEvents: row-click container is a test stand-in
        <div onClick={onRowClick} data-testid="row-stand-in">
          <RowActionsCell
            buttons={buttons({ icon: "add", prompt: "Add", action: jest.fn() })}
            onActivate={onActivate}
          />
        </div>
      );
      screen.getByTestId(ROW_ACTION_BUTTON).click();
      expect(onActivate).toHaveBeenCalledWith(0);
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it("disables a button flagged disabled and does not activate it on click", () => {
      const onActivate = jest.fn();
      render(
        <RowActionsCell
          buttons={buttons({ icon: "clearRight", prompt: "Clear", disabled: true, action: jest.fn() })}
          onActivate={onActivate}
        />
      );
      const button = screen.getByTestId(ROW_ACTION_BUTTON);
      expect(button).toBeDisabled();
      button.click();
      expect(onActivate).not.toHaveBeenCalled();
    });

    it("renders nothing when there are no buttons", () => {
      const { container } = render(<RowActionsCell buttons={[]} onActivate={jest.fn()} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("skips a button with an unknown icon preset (no ghost button)", () => {
      render(
        <RowActionsCell
          // Stale/removed preset (e.g. the old "separator") must not paint an empty button.
          buttons={[
            { icon: "separator" as unknown as RowActionButton["icon"], prompt: "x" },
            { icon: "add", prompt: "Add" },
          ]}
          onActivate={jest.fn()}
        />
      );
      expect(screen.getAllByTestId(ROW_ACTION_BUTTON)).toHaveLength(1);
    });
  });
});
