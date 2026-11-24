import { fireEvent, render, screen } from "@testing-library/react";
import type { FavoritesWidgetData } from "@workspaceui/api-client/src/api/dashboard";
import FavoritesRenderer from "@/screens/Home/widgets/renderers/FavoritesRenderer";
import { WIDGET_CHIP_CLASSES, WIDGET_EMPTY_TEXT_CLASSES } from "../chipClasses";

const mockSetWindowActive = jest.fn();
const mockSeed = jest.fn();
const mockPrefetchOnHover = jest.fn();
const mockNewWindowIdentifier = jest.fn((windowId: string) => `${windowId}_123`);

jest.mock("@/stores/windowStore", () => ({
  useWindowStore: Object.assign(
    (selector: (state: unknown) => unknown) => selector({ setWindowActive: mockSetWindowActive }),
    { getState: () => ({ windows: {}, dirtyWindows: {}, setWindowActive: mockSetWindowActive }) }
  ),
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

  it("uses the light chips and the contrast-safe empty text of the other list widgets", () => {
    const { unmount } = render(<FavoritesRenderer data={dataWith([])} />);
    expect(screen.getByTestId("FavoritesRenderer__empty")).toHaveClass(...WIDGET_EMPTY_TEXT_CLASSES.split(" "));
    unmount();

    render(<FavoritesRenderer data={dataWith([{ windowId: "143", label: "Sales Order" }])} />);
    expect(screen.getByTestId("FavoritesRenderer__item_143")).toHaveClass(...WIDGET_CHIP_CLASSES.split(" "));
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

  it("keeps a long label on one line and shows it whole on hover", () => {
    render(<FavoritesRenderer data={dataWith([{ windowId: "143", label: "Sales Order" }])} />);

    const item = screen.getByTestId("FavoritesRenderer__item_143");
    expect(item).toHaveClass("truncate", "whitespace-nowrap");
    expect(item).toHaveAttribute("title", "Sales Order");
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
