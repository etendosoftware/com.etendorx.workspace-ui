import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LinkedItems, type LinkedItemsProps } from "./index";

const baseProps = (): LinkedItemsProps => ({
  windowId: "123",
  entityName: "BusinessPartner",
  recordId: "4028E6C72959682B01295F40C3CB02EC",
  onFetchCategories: jest.fn().mockResolvedValue([]),
  onFetchItems: jest.fn().mockResolvedValue([]),
  onItemClick: jest.fn(),
  loadingText: "Loading",
  noCategoriesText: "No categories",
  noSelectedCategoryText: "Select a category",
});

describe("LinkedItems ready gating", () => {
  it("fetches categories on mount when ready is not provided (default true)", async () => {
    const props = baseProps();
    render(<LinkedItems {...props} />);
    await waitFor(() => expect(props.onFetchCategories).toHaveBeenCalledTimes(1));
  });

  it("does NOT fetch categories while ready is false", async () => {
    const props = baseProps();
    render(<LinkedItems {...props} ready={false} />);
    // Give any effects a chance to run.
    await new Promise((r) => setTimeout(r, 0));
    expect(props.onFetchCategories).not.toHaveBeenCalled();
  });

  it("fetches categories once ready flips from false to true", async () => {
    const props = baseProps();
    const { rerender } = render(<LinkedItems {...props} ready={false} />);
    await new Promise((r) => setTimeout(r, 0));
    expect(props.onFetchCategories).not.toHaveBeenCalled();

    rerender(<LinkedItems {...props} ready={true} />);
    await waitFor(() => expect(props.onFetchCategories).toHaveBeenCalledTimes(1));
  });
});

describe("LinkedItems record change", () => {
  const category = {
    adTabId: "tab-1",
    adWindowId: "123",
    columnName: "C_BPartner_ID",
    fullElementName: "Sales Order - Business Partner",
    tableName: "C_Order",
    total: "1",
  };
  const item = { adTabId: "tab-2", adWindowId: "456", adMenuName: "Sales Order", id: "order-1", name: "SO-001" };

  it("clears the previous record categories, selection and items when the record changes", async () => {
    const props = baseProps();
    (props.onFetchCategories as jest.Mock).mockResolvedValueOnce([category]).mockReturnValueOnce(new Promise(() => {}));
    (props.onFetchItems as jest.Mock).mockResolvedValue([item]);
    const { rerender } = render(<LinkedItems {...props} />);

    fireEvent.click(await screen.findByText(category.fullElementName));
    expect(await screen.findByText(item.name)).toBeInTheDocument();

    rerender(<LinkedItems {...props} recordId="ANOTHER_RECORD" />);

    expect(screen.queryByText(category.fullElementName)).not.toBeInTheDocument();
    expect(screen.queryByText(item.name)).not.toBeInTheDocument();
    expect(screen.getByText(props.noSelectedCategoryText)).toBeInTheDocument();
  });
});
