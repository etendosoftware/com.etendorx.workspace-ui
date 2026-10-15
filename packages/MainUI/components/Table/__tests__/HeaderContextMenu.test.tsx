import { fireEvent, render, screen } from "@testing-library/react";
import type { MRT_Column } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { HeaderContextMenu, type SummaryType, getSummaryTypes } from "../HeaderContextMenu";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const COLUMN_ID = "Total Gross Amount";
const SET_SUMMARY_ITEM = "set-summary-menu-item";

const makeColumn = (type: string) =>
  ({ id: COLUMN_ID, columnDef: { header: COLUMN_ID, type } }) as unknown as MRT_Column<EntityData>;

/** Renders the menu open on a column of the given type. */
const renderMenu = (type: string, activeSummary: Record<string, SummaryType> = {}) => {
  const props = { onClose: jest.fn(), onSetSummary: jest.fn(), onRemoveSummary: jest.fn() };
  render(
    <HeaderContextMenu anchorEl={document.body} column={makeColumn(type)} activeSummary={activeSummary} {...props} />
  );
  return props;
};

describe("HeaderContextMenu", () => {
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

  it("offers only the summary functions, not grouping", () => {
    renderMenu("tabledir");

    expect(screen.getByTestId(SET_SUMMARY_ITEM)).toBeInTheDocument();
    expect(screen.queryByText(/group/i)).not.toBeInTheDocument();
  });

  it("offers sum and average only for numeric columns", () => {
    renderMenu("amount");
    fireEvent.mouseEnter(screen.getByTestId(SET_SUMMARY_ITEM));

    expect(screen.getByText("table.summary.sum")).toBeInTheDocument();
    expect(screen.getByText("table.summary.avg")).toBeInTheDocument();
  });

  it("sets the chosen summary function", () => {
    const props = renderMenu("tabledir");
    fireEvent.mouseEnter(screen.getByTestId(SET_SUMMARY_ITEM));

    fireEvent.click(screen.getByText("table.summary.count"));

    expect(props.onSetSummary).toHaveBeenCalledWith(COLUMN_ID, "count");
    expect(props.onClose).toHaveBeenCalled();
    expect(screen.queryByText("table.summary.sum")).not.toBeInTheDocument();
  });

  it("removes an active summary function", () => {
    const props = renderMenu("amount", { [COLUMN_ID]: "sum" });

    fireEvent.click(screen.getByTestId("remove-summary-menu-item"));

    expect(props.onRemoveSummary).toHaveBeenCalledWith(COLUMN_ID);
  });
});

describe("getSummaryTypes", () => {
  it.each(["integer", "number", "quantity", "amount"])("adds sum and average for %s columns", (type) => {
    expect(getSummaryTypes({ type })).toEqual(["min", "max", "count", "sum", "avg"]);
  });

  it.each([undefined, "tabledir", "date"])("offers min, max and count for %p columns", (type) => {
    expect(getSummaryTypes({ type })).toEqual(["min", "max", "count"]);
  });
});
