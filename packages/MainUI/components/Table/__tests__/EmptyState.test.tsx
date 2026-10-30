import { fireEvent, render, screen } from "@testing-library/react";
import { UIPattern } from "@workspaceui/api-client/src/api/types";
import EmptyState from "../EmptyState";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@workspaceui/componentlibrary/src/components/Button/Button", () => ({
  __esModule: true,
  default: ({ children, onClick, "data-testid": testId }: any) => (
    <button type="button" onClick={onClick} data-testid={testId}>
      {children}
    </button>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/plus-circle.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="PlusCircle__empty-state" />,
}));

const INSERT_BUTTON = "Button__insert-row-empty-state";

describe("EmptyState", () => {
  it("tells there are no records", () => {
    render(<EmptyState />);

    expect(screen.getByText("table.labels.emptyRecords")).toBeInTheDocument();
    expect(screen.getByText("status.noRecords")).toBeInTheDocument();
  });

  it("offers to create a record when the grid allows it", () => {
    const onInsertRow = jest.fn();
    render(<EmptyState onInsertRow={onInsertRow} uIPattern={UIPattern.STANDARD} />);

    fireEvent.click(screen.getByTestId(INSERT_BUTTON));

    expect(screen.getByText("table.actions.createRecordInGrid")).toBeInTheDocument();
    expect(onInsertRow).toHaveBeenCalledTimes(1);
  });

  it("offers to create a record when the grid has no pattern", () => {
    render(<EmptyState onInsertRow={jest.fn()} />);

    expect(screen.getByTestId(INSERT_BUTTON)).toBeInTheDocument();
  });

  it.each([UIPattern.READ_ONLY, UIPattern.EDIT_ONLY, UIPattern.EDIT_AND_DELETE_ONLY])(
    "does not offer to create a record in a %s grid",
    (pattern) => {
      render(<EmptyState onInsertRow={jest.fn()} uIPattern={pattern} />);

      expect(screen.queryByTestId(INSERT_BUTTON)).not.toBeInTheDocument();
    }
  );

  it("does not offer to create a record without a way to insert it", () => {
    render(<EmptyState uIPattern={UIPattern.STANDARD} />);

    expect(screen.queryByTestId(INSERT_BUTTON)).not.toBeInTheDocument();
  });

  it("only tells that several parents are selected, with nothing to create", () => {
    render(<EmptyState multipleParents onInsertRow={jest.fn()} />);

    expect(screen.getByTestId("EmptyState__multipleParents")).toHaveTextContent("table.labels.multipleParentsSelected");
    expect(screen.queryByText("table.labels.emptyRecords")).not.toBeInTheDocument();
    expect(screen.queryByTestId(INSERT_BUTTON)).not.toBeInTheDocument();
  });

  it("reports the context menu of its area", () => {
    const onContextMenu = jest.fn();
    const { container } = render(<EmptyState onContextMenu={onContextMenu} />);

    fireEvent.contextMenu(container.firstElementChild as Element);

    expect(onContextMenu).toHaveBeenCalledTimes(1);
  });

  it("takes the width of the table container before the one it is given", () => {
    const table = { refs: { tableContainerRef: { current: { clientWidth: 420 } } } } as any;
    const { container } = render(<EmptyState table={table} maxWidth={900} containerStyle={{ color: "red" }} />);

    const area = container.firstElementChild as HTMLElement;
    expect(area.style.maxWidth).toBe("420px");
    expect(area.style.color).toBe("red");
  });

  it("uses the width it is given when there is no table", () => {
    const { container } = render(<EmptyState maxWidth={300} />);

    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe("300px");
  });
});
