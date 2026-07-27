import { render, waitFor } from "@testing-library/react";
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
