import { fireEvent, render, screen } from "@testing-library/react";
import type { FavoritesWidgetData } from "@workspaceui/api-client/src/api/dashboard";
import FavoritesRenderer from "@/screens/Home/widgets/renderers/FavoritesRenderer";

const mockSetWindowActive = jest.fn();
const mockSeed = jest.fn();
const mockPrefetchOnHover = jest.fn();
const mockNewWindowIdentifier = jest.fn((windowId: string) => `${windowId}_123`);

jest.mock("@/stores/windowStore", () => ({
  useWindowStore: (selector: (state: unknown) => unknown) => selector({ setWindowActive: mockSetWindowActive }),
}));

jest.mock("@/stores/favoritesStore", () => ({
  useFavoritesStore: (selector: (state: unknown) => unknown) => selector({ seed: mockSeed }),
}));

jest.mock("@/hooks/usePrefetchWindowOnHover", () => ({
  usePrefetchWindowOnHover: () => mockPrefetchOnHover,
}));

jest.mock("@/utils/window/utils", () => ({
  getNewWindowIdentifier: (windowId: string) => mockNewWindowIdentifier(windowId),
}));

const dataWith = (items: Array<{ windowId: string; label: string }>) => ({ items }) as unknown as FavoritesWidgetData;

describe("FavoritesRenderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a dash when there are no favorites", () => {
    render(<FavoritesRenderer data={dataWith([])} />);

    expect(screen.getByTestId("FavoritesRenderer__empty")).toBeInTheDocument();
    expect(screen.queryByTestId("FavoritesRenderer__list")).not.toBeInTheDocument();
  });

  it("lists each favorite by its label", () => {
    render(
      <FavoritesRenderer
        data={dataWith([
          { windowId: "143", label: "Sales Order" },
          { windowId: "140", label: "Product" },
        ])}
      />
    );

    expect(screen.getByTestId("FavoritesRenderer__item_143")).toHaveTextContent("Sales Order");
    expect(screen.getByTestId("FavoritesRenderer__item_140")).toHaveTextContent("Product");
  });

  it("seeds the favorites store with the items", () => {
    const data = dataWith([{ windowId: "143", label: "Sales Order" }]);

    render(<FavoritesRenderer data={data} />);

    expect(mockSeed).toHaveBeenCalledWith((data as unknown as { items: unknown }).items);
  });

  it("opens the window of a favorite in a new tab with its label as title", () => {
    render(<FavoritesRenderer data={dataWith([{ windowId: "143", label: "Sales Order" }])} />);

    fireEvent.click(screen.getByTestId("FavoritesRenderer__item_143"));

    expect(mockSetWindowActive).toHaveBeenCalledWith({
      windowIdentifier: "143_123",
      windowData: { title: "Sales Order", initialized: true },
    });
  });

  it("prefetches the window when a favorite is hovered or focused", () => {
    render(<FavoritesRenderer data={dataWith([{ windowId: "143", label: "Sales Order" }])} />);
    const item = screen.getByTestId("FavoritesRenderer__item_143");

    fireEvent.mouseEnter(item);
    fireEvent.focus(item);

    expect(mockPrefetchOnHover).toHaveBeenCalledTimes(2);
    expect(mockPrefetchOnHover).toHaveBeenCalledWith("143");
  });
});
