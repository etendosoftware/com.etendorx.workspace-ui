import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LinkedItems, type LinkedItem, type LinkedItemCategory, type LinkedItemsProps } from "./index";

const NO_CATEGORIES_TEXT = "No categories";
const NO_ITEMS_TEXT = "No linked items";

const baseProps = (): LinkedItemsProps => ({
  windowId: "123",
  entityName: "BusinessPartner",
  recordId: "4028E6C72959682B01295F40C3CB02EC",
  onFetchCategories: jest.fn().mockResolvedValue([]),
  onFetchItems: jest.fn().mockResolvedValue([]),
  onItemClick: jest.fn(),
  loadingText: "Loading",
  noCategoriesText: NO_CATEGORIES_TEXT,
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

const CATEGORY: LinkedItemCategory = {
  adTabId: "186",
  adWindowId: "143",
  columnName: "C_BPartner_ID",
  fullElementName: "Sales Order - Business Partner",
  tableName: "C_Order",
  total: "1",
};

const ITEM: LinkedItem = {
  adTabId: "186",
  adWindowId: "143",
  adMenuName: "Sales Order",
  id: "ORDER-1",
  name: "SO-1000",
};

const renderAndSelectCategory = async (props: LinkedItemsProps) => {
  render(<LinkedItems {...props} />);
  fireEvent.click(await screen.findByText(CATEGORY.fullElementName));
  await waitFor(() => expect(props.onFetchItems).toHaveBeenCalledTimes(1));
};

const propsWithCategory = (items: LinkedItem[], overrides: Partial<LinkedItemsProps> = {}): LinkedItemsProps => ({
  ...baseProps(),
  onFetchCategories: jest.fn().mockResolvedValue([CATEGORY]),
  onFetchItems: jest.fn().mockResolvedValue(items),
  ...overrides,
});

describe("LinkedItems empty states", () => {
  it("shows the item list when the selected category has items", async () => {
    await renderAndSelectCategory(propsWithCategory([ITEM], { noItemsText: NO_ITEMS_TEXT }));
    expect(await screen.findByText(ITEM.name)).toBeInTheDocument();
    expect(screen.queryByText(NO_ITEMS_TEXT)).not.toBeInTheDocument();
  });

  it("shows the dedicated no-items message when the selected category has no items", async () => {
    await renderAndSelectCategory(propsWithCategory([], { noItemsText: NO_ITEMS_TEXT }));
    expect(await screen.findByText(NO_ITEMS_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(NO_CATEGORIES_TEXT)).not.toBeInTheDocument();
  });

  it("falls back to the no-categories message when noItemsText is not provided", async () => {
    await renderAndSelectCategory(propsWithCategory([]));
    expect(await screen.findByText(NO_CATEGORIES_TEXT)).toBeInTheDocument();
  });

  it("keeps the no-categories message when the record has no categories", async () => {
    render(<LinkedItems {...baseProps()} noItemsText={NO_ITEMS_TEXT} />);
    expect(await screen.findByText(NO_CATEGORIES_TEXT)).toBeInTheDocument();
    expect(screen.getByText("Select a category")).toBeInTheDocument();
    expect(screen.queryByText(NO_ITEMS_TEXT)).not.toBeInTheDocument();
  });
});
