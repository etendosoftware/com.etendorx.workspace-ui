import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import type { MRT_Cell, MRT_Row } from "material-react-table";
import type { Column, EntityData } from "@workspaceui/api-client/src/api/types";
import {
  AggregatedCell,
  GROUP_ROW_CLASS_NAME,
  GroupedCell,
  getGroupRowProps,
  getGroupingColumnProps,
} from "../groupingColumns";

const COLUMN_ID = "Business Partner";
const FIELD = "businessPartner";
const TOGGLE_TEST_ID = "grouped-cell-toggle";
const COLUMN = { id: COLUMN_ID, columnName: FIELD } as Column;

type Cell = MRT_Cell<EntityData>;
type Row = MRT_Row<EntityData>;

/** Builds a group header row mock. */
const makeGroupRow = (isExpanded: boolean, subRowsCount = 2) =>
  ({
    original: { id: "rec-1", [FIELD]: "bp-1", [`${FIELD}$_identifier`]: "Customer A" },
    subRows: Array.from({ length: subRowsCount }),
    getIsExpanded: () => isExpanded,
    toggleExpanded: jest.fn(),
  }) as unknown as Row;

/** Builds a cell mock of the given column definition. */
const makeCell = (columnDef: Record<string, unknown>, value?: unknown) =>
  ({ column: { id: COLUMN_ID, columnDef }, getValue: () => value }) as unknown as Cell;

/** Renders the element returned by a cell renderer. */
const renderCell = (node: React.ReactNode) => render(node as React.ReactElement);

describe("groupingColumns", () => {
  describe("GroupedCell", () => {
    it("shows the group identifier and its record count", () => {
      renderCell(GroupedCell({ cell: makeCell({ columnName: FIELD }), row: makeGroupRow(false, 3) }));

      expect(screen.getByText("Customer A")).toBeInTheDocument();
      expect(screen.getByText("(3)")).toBeInTheDocument();
      expect(screen.getByTestId(TOGGLE_TEST_ID)).toHaveAttribute("aria-expanded", "false");
    });

    it("toggles the group without propagating the click to the row", () => {
      const row = makeGroupRow(true);
      const onDocumentClick = jest.fn();
      document.addEventListener("click", onDocumentClick);
      renderCell(GroupedCell({ cell: makeCell({ columnName: FIELD }), row }));

      fireEvent.click(screen.getByTestId(TOGGLE_TEST_ID));
      document.removeEventListener("click", onDocumentClick);

      expect(row.toggleExpanded).toHaveBeenCalled();
      expect(onDocumentClick).not.toHaveBeenCalled();
      expect(screen.getByTestId(TOGGLE_TEST_ID)).toHaveAttribute("aria-expanded", "true");
    });

    it("falls back to the column id and to an empty count", () => {
      const row = { ...makeGroupRow(false), subRows: undefined, original: { [COLUMN_ID]: "raw" } } as unknown as Row;
      renderCell(GroupedCell({ cell: makeCell({}), row }));

      expect(screen.getByText("raw")).toBeInTheDocument();
      expect(screen.getByText("(0)")).toBeInTheDocument();
    });
  });

  describe("AggregatedCell", () => {
    it("shows the numeric subtotal", () => {
      renderCell(AggregatedCell({ cell: makeCell({}, 1234.5) }));

      expect(screen.getByTestId("aggregated-cell")).toHaveTextContent((1234.5).toLocaleString());
    });

    it("renders nothing without a numeric subtotal", () => {
      expect(AggregatedCell({ cell: makeCell({}, null) })).toBeNull();
    });
  });

  describe("getGroupingColumnProps", () => {
    it("disables MRT's own grouping menu and groups by the raw value", () => {
      const props = getGroupingColumnProps(COLUMN, {});
      const getGroupingValue = props.getGroupingValue as (record: EntityData) => unknown;

      expect(props.enableGrouping).toBe(false);
      expect(props.GroupedCell).toBe(GroupedCell);
      expect(getGroupingValue({ id: "r", [FIELD]: "bp-1" } as EntityData)).toBe("bp-1");
      expect(props).not.toHaveProperty("enableHiding");
      expect(props).not.toHaveProperty("aggregationFn");
    });

    it("locks the grouped column", () => {
      const props = getGroupingColumnProps(COLUMN, { groupedColumnId: COLUMN_ID });

      expect(props).toMatchObject({ enableHiding: false, enableColumnOrdering: false, enableColumnDragging: false });
    });

    it("turns a summary function into the group subtotal", () => {
      const props = getGroupingColumnProps(COLUMN, { summaryType: "sum" });
      const aggregationFn = props.aggregationFn as (columnId: string, leafRows: Row[]) => unknown;
      const leafRows = [5, 7].map((amount) => ({ original: { [FIELD]: amount } }) as unknown as Row);

      expect(aggregationFn(COLUMN_ID, leafRows)).toBe(12);
      expect(props.AggregatedCell).toBe(AggregatedCell);
    });
  });

  it("makes group header rows only toggle their group", () => {
    const toggle = jest.fn();
    const row = { getToggleExpandedHandler: () => toggle } as unknown as Row;
    const table = {} as never;

    expect(getGroupRowProps(row, table)).toEqual({ onClick: toggle, className: GROUP_ROW_CLASS_NAME, row, table });
  });
});
