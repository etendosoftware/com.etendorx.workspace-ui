import { fireEvent, render, screen } from "@testing-library/react";
import type { MRT_Column, MRT_TableInstance } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { type ColumnActionsMenuOptions, buildColumnActionsMenuItems } from "../ColumnActionsMenuItems";
import type { GroupingMenuActions } from "../HeaderContextMenu";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const COLUMN_ID = "Business Partner";
const OTHER_COLUMN_ID = "Document Status";
const GROUP_BY_ITEM = "column-actions-group-by";
const UNGROUP_ITEM = "column-actions-ungroup";
const REMOVE_SUMMARY_ITEM = "column-actions-remove-summary";

const icon = () => <span />;
const table = {
  options: { icons: { ArrowRightIcon: icon, ClearAllIcon: icon, DynamicFeedIcon: icon } },
} as unknown as MRT_TableInstance<EntityData>;

const makeColumn = (type = "tabledir", columnDef: Record<string, unknown> = { header: COLUMN_ID }) =>
  ({ id: COLUMN_ID, columnDef: { id: COLUMN_ID, type, ...columnDef } }) as unknown as MRT_Column<EntityData>;

const makeGrouping = (overrides: Partial<GroupingMenuActions> = {}): GroupingMenuActions => ({
  groupedColumnId: undefined,
  getGroupByLabel: (title) => `Group by ${title}`,
  getUngroupLabel: () => "Ungroup",
  onGroupBy: jest.fn(),
  onUngroup: jest.fn(),
  ...overrides,
});

/** Renders the menu items built for a column; `options` overrides the summary/grouping options. */
const renderItems = (options: Partial<ColumnActionsMenuOptions> = {}, column = makeColumn()) => {
  const closeMenu = jest.fn();
  const menuOptions: ColumnActionsMenuOptions = {
    activeSummary: {},
    onSetSummary: jest.fn(),
    onRemoveSummary: jest.fn(),
    ...options,
  };
  const items = buildColumnActionsMenuItems(
    { closeMenu, column, table, internalColumnMenuItems: [<li key="internal" data-testid="internal-item" />] },
    menuOptions
  );
  render(<ul>{items}</ul>);
  return { closeMenu, menuOptions };
};

/** Opens the summary sub menu. */
const openSummarySubMenu = () => fireEvent.click(screen.getByTestId("column-actions-set-summary"));

describe("buildColumnActionsMenuItems", () => {
  it("keeps MRT's own items and adds the summary item", () => {
    renderItems();

    expect(screen.getByTestId("internal-item")).toBeInTheDocument();
    expect(screen.getByText("table.setSummaryFunction")).toBeInTheDocument();
    expect(screen.queryByTestId(REMOVE_SUMMARY_ITEM)).not.toBeInTheDocument();
    expect(screen.queryByTestId(GROUP_BY_ITEM)).not.toBeInTheDocument();
  });

  it("offers min, max and count for non numeric columns and sets the chosen one", () => {
    const { closeMenu, menuOptions } = renderItems();

    openSummarySubMenu();

    expect(screen.getByTestId("column-actions-summary-count")).toBeInTheDocument();
    expect(screen.queryByTestId("column-actions-summary-sum")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("column-actions-summary-max"));
    expect(menuOptions.onSetSummary).toHaveBeenCalledWith(COLUMN_ID, "max");
    expect(closeMenu).toHaveBeenCalled();
  });

  it("also offers sum and average for numeric columns", () => {
    renderItems({}, makeColumn("amount"));

    openSummarySubMenu();

    expect(screen.getByTestId("column-actions-summary-sum")).toBeInTheDocument();
    expect(screen.getByTestId("column-actions-summary-avg")).toBeInTheDocument();
  });

  it("closes the summary sub menu without choosing", () => {
    const { menuOptions } = renderItems();
    openSummarySubMenu();

    fireEvent.keyDown(screen.getByTestId("column-actions-summary-min"), { key: "Escape" });

    expect(menuOptions.onSetSummary).not.toHaveBeenCalled();
  });

  it("removes an active summary", () => {
    const { closeMenu, menuOptions } = renderItems({ activeSummary: { [COLUMN_ID]: "sum" } });

    fireEvent.click(screen.getByTestId(REMOVE_SUMMARY_ITEM));

    expect(menuOptions.onRemoveSummary).toHaveBeenCalledWith(COLUMN_ID);
    expect(closeMenu).toHaveBeenCalled();
  });

  it("groups by the column", () => {
    const grouping = makeGrouping();
    const { closeMenu } = renderItems({ grouping });

    fireEvent.click(screen.getByText(`Group by ${COLUMN_ID}`));

    expect(grouping.onGroupBy).toHaveBeenCalledWith(COLUMN_ID);
    expect(closeMenu).toHaveBeenCalled();
    expect(screen.queryByTestId(UNGROUP_ITEM)).not.toBeInTheDocument();
  });

  it("uses the column id as title when the header is missing", () => {
    renderItems({ grouping: makeGrouping() }, makeColumn("tabledir", {}));

    expect(screen.getByTestId(GROUP_BY_ITEM)).toHaveTextContent(`Group by ${COLUMN_ID}`);
  });

  it("does not offer grouping by a non groupable column", () => {
    renderItems({ grouping: makeGrouping() }, makeColumn("boolean"));

    expect(screen.queryByTestId(GROUP_BY_ITEM)).not.toBeInTheDocument();
  });

  it("offers only Ungroup on the grouped column", () => {
    const grouping = makeGrouping({ groupedColumnId: COLUMN_ID });
    const { closeMenu } = renderItems({ grouping });

    expect(screen.queryByTestId(GROUP_BY_ITEM)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId(UNGROUP_ITEM));

    expect(grouping.onUngroup).toHaveBeenCalled();
    expect(closeMenu).toHaveBeenCalled();
  });

  it("offers regrouping and Ungroup on another column of a grouped grid", () => {
    renderItems({ grouping: makeGrouping({ groupedColumnId: OTHER_COLUMN_ID }) });

    expect(screen.getByTestId(GROUP_BY_ITEM)).toBeInTheDocument();
    expect(screen.getByTestId(UNGROUP_ITEM)).toBeInTheDocument();
  });
});
