import { render, screen } from "@testing-library/react";
import ColumnVisibilityMenu from "../ColumnVisibilityMenu";
import { useTranslation } from "@/hooks/useTranslation";
import { useTabContext } from "@/contexts/tab";
import { useWindowContext } from "@/contexts/window";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";
import React from "react";

jest.mock("@/hooks/useTranslation");
jest.mock("@/contexts/tab");
jest.mock("@/contexts/window");
jest.mock("@/hooks/useTableStatePersistenceTab");

jest.mock("@workspaceui/componentlibrary/src/components/Menu", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-menu">{children}</div>,
}));

jest.mock("@workspaceui/componentlibrary/src/components/DragModal/DragModalContent", () => ({
  __esModule: true,
  default: ({ items }: { items: any[] }) => (
    <div data-testid="mock-drag-content">
      {items.map((item) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          {item.label}
        </div>
      ))}
    </div>
  ),
}));

describe("ColumnVisibilityMenu", () => {
  let mockTable: any;

  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({ t: (s: string) => s });
    (useTabContext as jest.Mock).mockReturnValue({ tab: { id: "tab1" } });
    (useWindowContext as jest.Mock).mockReturnValue({
      activeWindow: { windowIdentifier: "win1" },
    });
    (useTableStatePersistenceTab as jest.Mock).mockReturnValue({
      tableColumnVisibility: { col1: true },
    });

    mockTable = {
      getAllLeafColumns: jest.fn(() => [
        {
          id: "col1",
          columnDef: { header: "Column 1" },
          getIsVisible: () => true,
        },
        {
          id: "mrt-row-actions",
          columnDef: { header: "Actions" },
          getIsVisible: () => true,
        },
      ]),
      getState: jest.fn(() => ({ columnVisibility: { col1: true } })),
      setColumnVisibility: jest.fn(),
    };
  });

  it("should render menu and items", () => {
    render(<ColumnVisibilityMenu anchorEl={document.createElement("div")} onClose={jest.fn()} table={mockTable} />);

    expect(screen.getByTestId("mock-menu")).toBeInTheDocument();
    expect(screen.getByTestId("mock-drag-content")).toBeInTheDocument();
    expect(screen.getByTestId("item-col1")).toBeInTheDocument();
  });

  it("should filter out mrt- columns, buttons, and image columns", () => {
    mockTable.getAllLeafColumns.mockReturnValue([
      {
        id: "mrt-select",
        columnDef: {},
        getIsVisible: () => true,
      },
      {
        id: "btn1",
        columnDef: { type: "button", header: "Button" },
        getIsVisible: () => true,
      },
      {
        id: "img1",
        columnDef: { type: "image", header: "Image Column" },
        getIsVisible: () => true,
      },
      {
        id: "col1",
        columnDef: { header: "Real Column" },
        getIsVisible: () => true,
      },
    ]);

    render(<ColumnVisibilityMenu anchorEl={document.createElement("div")} onClose={jest.fn()} table={mockTable} />);

    expect(screen.queryByTestId("item-mrt-select")).not.toBeInTheDocument();
    expect(screen.queryByTestId("item-btn1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("item-img1")).not.toBeInTheDocument();
    expect(screen.getByTestId("item-col1")).toBeInTheDocument();
  });

  it("should sort items by label", () => {
    mockTable.getAllLeafColumns.mockReturnValue([
      {
        id: "b",
        columnDef: { header: "B" },
        getIsVisible: () => true,
      },
      {
        id: "a",
        columnDef: { header: "A" },
        getIsVisible: () => true,
      },
    ]);

    render(<ColumnVisibilityMenu anchorEl={document.createElement("div")} onClose={jest.fn()} table={mockTable} />);

    const items = screen.getAllByTestId(/^item-/);
    expect(items[0].textContent).toBe("A");
    expect(items[1].textContent).toBe("B");
  });
});
