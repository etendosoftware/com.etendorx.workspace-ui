import { fireEvent, render, screen } from "@testing-library/react";
import type { MRT_Column } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { HeaderContextMenu, type HeaderGroupingOptions } from "../HeaderContextMenu";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const COLUMN_ID = "Business Partner";
const OTHER_COLUMN_ID = "Document Status";
const GROUP_BY_ITEM = "group-by-menu-item";
const UNGROUP_ITEM = "ungroup-menu-item";

const makeColumn = (id = COLUMN_ID, columnDef: Record<string, unknown> = { header: id }) =>
  ({ id, columnDef: { type: "tabledir", ...columnDef } }) as unknown as MRT_Column<EntityData>;

const makeGrouping = (overrides: Partial<HeaderGroupingOptions> = {}): HeaderGroupingOptions => ({
  canGroupBy: true,
  groupedColumnId: undefined,
  getGroupByLabel: (title) => `Group by ${title}`,
  getUngroupLabel: () => "Ungroup",
  onGroupBy: jest.fn(),
  onUngroup: jest.fn(),
  ...overrides,
});

/** Renders the menu open on the given column. */
const renderMenu = (grouping?: HeaderGroupingOptions, column = makeColumn()) => {
  const onClose = jest.fn();
  render(
    <HeaderContextMenu
      anchorEl={document.body}
      onClose={onClose}
      column={column}
      onSetSummary={jest.fn()}
      onRemoveSummary={jest.fn()}
      activeSummary={{}}
      grouping={grouping}
    />
  );
  return { onClose };
};

describe("HeaderContextMenu grouping items", () => {
  it("renders nothing without a column", () => {
    const { container } = render(
      <HeaderContextMenu
        anchorEl={null}
        onClose={jest.fn()}
        column={null}
        onSetSummary={jest.fn()}
        onRemoveSummary={jest.fn()}
        activeSummary={{}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("offers no grouping items when grouping is not available", () => {
    renderMenu(undefined);

    expect(screen.getByTestId("set-summary-menu-item")).toBeInTheDocument();
    expect(screen.queryByTestId(GROUP_BY_ITEM)).not.toBeInTheDocument();
    expect(screen.queryByTestId(UNGROUP_ITEM)).not.toBeInTheDocument();
  });

  it("groups by the column", () => {
    const grouping = makeGrouping();
    const { onClose } = renderMenu(grouping);

    fireEvent.click(screen.getByText(`Group by ${COLUMN_ID}`));

    expect(grouping.onGroupBy).toHaveBeenCalledWith(COLUMN_ID);
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByTestId(UNGROUP_ITEM)).not.toBeInTheDocument();
  });

  it("uses the column id as title when the header is missing", () => {
    renderMenu(makeGrouping(), makeColumn(COLUMN_ID, {}));

    expect(screen.getByTestId(GROUP_BY_ITEM)).toHaveTextContent(`Group by ${COLUMN_ID}`);
  });

  it("does not offer grouping by a non-groupable column", () => {
    renderMenu(makeGrouping({ canGroupBy: false }));

    expect(screen.queryByTestId(GROUP_BY_ITEM)).not.toBeInTheDocument();
  });

  it("offers only Ungroup on the grouped column", () => {
    const grouping = makeGrouping({ groupedColumnId: COLUMN_ID });
    const { onClose } = renderMenu(grouping);

    expect(screen.queryByTestId(GROUP_BY_ITEM)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Ungroup"));

    expect(grouping.onUngroup).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("offers both regrouping and Ungroup on another column of a grouped grid", () => {
    renderMenu(makeGrouping({ groupedColumnId: OTHER_COLUMN_ID }));

    expect(screen.getByTestId(GROUP_BY_ITEM)).toBeInTheDocument();
    expect(screen.getByTestId(UNGROUP_ITEM)).toBeInTheDocument();
  });
});
