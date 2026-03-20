import type React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const clickSpy = jest.fn();
const keySpy = jest.fn();
const clientclassNavSpy = jest.fn();

jest.mock("@/hooks/navigation/useRedirect", () => ({
  useRedirect: () => ({
    handleClickRedirect: (props: {
      e: any;
      windowId?: string;
      windowTitle?: string;
      referencedTabId?: string;
      selectedRecordId?: string;
      tabLevel?: number;
    }) => clickSpy(props),
    handleKeyDownRedirect: (props: {
      e: any;
      windowId?: string;
      windowTitle?: string;
      referencedTabId?: string;
      selectedRecordId?: string;
      tabLevel?: number;
    }) => keySpy(props),
    handleClientclassNavigation: (props: { clientclass: string; recordId: string }) => clientclassNavSpy(props),
  }),
}));

import { useColumns } from "@/hooks/table/useColumns";

describe("useColumns - reference cell links carry record id", () => {
  beforeEach(() => {
    clickSpy.mockClear();
    keySpy.mockClear();
    clientclassNavSpy.mockClear();
  });

  it("passes the row id to redirect handlers when clicking a reference cell", () => {
    const tab: any = {
      fields: {
        C_Order_ID: {
          showInGridView: true,
          name: "Order",
          hqlName: "C_Order_ID",
          columnName: "C_Order_ID",
          column: { reference: "19" }, // TABLE_DIR reference
          referencedWindowId: "W9",
        },
      },
    };

    function Harness() {
      const columns = useColumns(tab);
      const Cell: any = (columns[0] as any).Cell;
      const row = { original: { id: "R77", C_Order_ID: "R77" } } as any;
      const cell = { getValue: () => "SO/1000" } as any;
      return <Cell row={row} cell={cell} />;
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /navigate to referenced window/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    const callArgs = clickSpy.mock.calls[0][0];
    expect(callArgs.windowId).toBe("W9");
    expect(callArgs.selectedRecordId).toBe("R77");
    expect(callArgs.windowTitle).toBeDefined();
    expect(callArgs.referencedTabId).toBeDefined();
  });
});

describe("useColumns - clientclass cell rendering", () => {
  beforeEach(() => {
    clientclassNavSpy.mockClear();
    clickSpy.mockClear();
  });

  const clientclassTab: any = {
    fields: {
      documentNo: {
        showInGridView: true,
        name: "Document No.",
        hqlName: "documentNo",
        columnName: "DocumentNo",
        column: { reference: "10" }, // String reference — NOT a FK
        clientclass: "SalesOrderTabLink",
        referencedWindowId: undefined,
        referencedTabId: undefined,
      },
    },
  };

  function Harness({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
    const columns = useColumns(clientclassTab, { onNavigate });
    const Cell = (columns[0] as unknown as { Cell: React.ComponentType<{ row: unknown; cell: unknown }> }).Cell;
    const row = { original: { id: "ORDER-42", documentNo: "SO/00042" } };
    const cell = { getValue: () => "SO/00042" };
    return <Cell row={row} cell={cell} />;
  }

  it("renders a button for clientclass fields", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: /navigate to referenced record/i })).toBeInTheDocument();
    expect(screen.getByText("SO/00042")).toBeInTheDocument();
  });

  it("calls handleClientclassNavigation with correct clientclass and row id on click", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /navigate to referenced record/i }));

    expect(clientclassNavSpy).toHaveBeenCalledTimes(1);
    expect(clientclassNavSpy).toHaveBeenCalledWith({
      clientclass: "SalesOrderTabLink",
      recordId: "ORDER-42",
    });
  });

  it("calls onNavigate callback on click", () => {
    const onNavigate = jest.fn();
    render(<Harness onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /navigate to referenced record/i }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("calls handleClientclassNavigation on Enter key", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("button", { name: /navigate to referenced record/i }), { key: "Enter" });

    expect(clientclassNavSpy).toHaveBeenCalledTimes(1);
    expect(clientclassNavSpy).toHaveBeenCalledWith({
      clientclass: "SalesOrderTabLink",
      recordId: "ORDER-42",
    });
  });

  it("calls handleClientclassNavigation on Space key", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("button", { name: /navigate to referenced record/i }), { key: " " });

    expect(clientclassNavSpy).toHaveBeenCalledTimes(1);
  });

  it("does not call handleClientclassNavigation on other keys", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("button", { name: /navigate to referenced record/i }), { key: "Tab" });

    expect(clientclassNavSpy).not.toHaveBeenCalled();
  });

  it("handles cell being undefined without crashing", () => {
    function HarnessNoGetValue() {
      const columns = useColumns(clientclassTab);
      const Cell = (columns[0] as unknown as { Cell: React.ComponentType<{ row: unknown; cell: unknown }> }).Cell;
      const row = { original: { id: "ORDER-42" } };
      // cell.getValue is undefined — simulates MRT calling Cell in certain contexts
      const cell = { getValue: undefined };
      return <Cell row={row} cell={cell} />;
    }
    expect(() => render(<HarnessNoGetValue />)).not.toThrow();
  });
});
