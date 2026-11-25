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

const mockGetCachedMenu = jest.fn(() => [] as unknown[]);
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { getCachedMenu: () => mockGetCachedMenu() },
}));

// The list is drawn with the live menu; unless a test sets it, it is the cached menu the click checks.
let mockLiveMenu: unknown[] | undefined;
jest.mock("@/hooks/useLiveMenu", () => ({ useLiveMenu: () => mockLiveMenu ?? mockGetCachedMenu() }));

const mockNotifyEntryUnavailable = jest.fn();
jest.mock("@/hooks/useEntryUnavailableNotice", () => ({
  useEntryUnavailableNotice: () => mockNotifyEntryUnavailable,
}));

const dataWith = (items: Array<{ windowId: string; label: string }>) => ({ items }) as unknown as FavoritesWidgetData;

describe("FavoritesRenderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCachedMenu.mockReturnValue([]);
    mockLiveMenu = undefined;
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

  describe("favorites the role can no longer open (ETP-6431)", () => {
    const salesOrderEntry = { id: "MENU_143", name: "Sales Order", type: "Window", windowId: "143" };
    const twoFavorites = dataWith([
      { windowId: "143", label: "Sales Order" },
      { windowId: "140", label: "Product" },
    ]);

    it("offers only the favorites of the role's menu", () => {
      mockGetCachedMenu.mockReturnValue([salesOrderEntry]);
      render(<FavoritesRenderer data={twoFavorites} />);

      expect(screen.getByTestId("FavoritesRenderer__item_143")).toBeInTheDocument();
      expect(screen.queryByTestId("FavoritesRenderer__item_140")).not.toBeInTheDocument();
    });

    it("shows the empty state when no favorite is in the role's menu, keeping the store seeded", () => {
      mockGetCachedMenu.mockReturnValue([{ ...salesOrderEntry, windowId: "999" }]);
      render(<FavoritesRenderer data={twoFavorites} />);

      expect(screen.getByTestId("FavoritesRenderer__empty")).toBeInTheDocument();
      expect(mockSeed).toHaveBeenCalledWith((twoFavorites as unknown as { items: unknown }).items);
    });

    it("tells the user and opens nothing when the current menu no longer has the window", () => {
      mockLiveMenu = [salesOrderEntry];
      mockGetCachedMenu.mockReturnValue([{ ...salesOrderEntry, windowId: "999" }]);
      render(<FavoritesRenderer data={dataWith([{ windowId: "143", label: "Sales Order" }])} />);

      fireEvent.click(screen.getByTestId("FavoritesRenderer__item_143"));

      expect(mockNotifyEntryUnavailable).toHaveBeenCalledTimes(1);
      expect(mockSetWindowActive).not.toHaveBeenCalled();
    });
  });
});
