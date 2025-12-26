import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const clickSpy = jest.fn();
const keySpy = jest.fn();

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
  }),
}));

import { useColumns } from "@/hooks/table/useColumns";

describe("useColumns - reference cell links carry record id", () => {
  beforeEach(() => {
    clickSpy.mockClear();
    keySpy.mockClear();
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
