import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const clickSpy = jest.fn();
const keySpy = jest.fn();

jest.mock("@/hooks/navigation/useRedirect", () => ({
  useRedirect: () => ({
    handleClickRedirect: (e: any, windowId?: string, windowIdentifier?: string, selectedRecordId?: string) =>
      clickSpy(e, windowId, windowIdentifier, selectedRecordId),
    handleKeyDownRedirect: (e: any, windowId?: string, windowIdentifier?: string, selectedRecordId?: string) =>
      keySpy(e, windowId, windowIdentifier, selectedRecordId),
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
      const row = { id: "R77", C_Order_ID: "R77" } as any;
      return (
        <Cell
          cell={{
            row: { original: row },
            getValue: () => "SO/1000",
          }}
        />
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /navigate to referenced window/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    const [_e, windowId, windowIdentifier, selectedRecordId] = clickSpy.mock.calls[0];
    expect(windowId).toBe("W9");
    expect(selectedRecordId).toBe("R77");
    expect(typeof windowIdentifier).toBe("string");
  });
});
