import { render, screen, fireEvent } from "@testing-library/react";
import { useWindowStore } from "@/stores/windowStore";
import { useTabs } from "../../../contexts/tabs";
import { useTranslation } from "../../../hooks/useTranslation";
import WindowTabs from "../../../components/NavigationTabs/WindowTabs";

// Mock dependencies
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({ onClick, children, className, "data-testid": testId }: any) => (
    <button onClick={onClick} className={className} data-testid={testId}>
      {children}
    </button>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/home.svg", () => ({
  __esModule: true,
  default: (props: any) => <svg {...props} data-testid={props["data-testid"] || "HomeIcon"} />,
}));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/chevron-right.svg", () => ({
  __esModule: true,
  default: (props: any) => <svg {...props} data-testid={props["data-testid"] || "ChevronRightIcon"} />,
}));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/chevron-left.svg", () => ({
  __esModule: true,
  default: (props: any) => <svg {...props} data-testid={props["data-testid"] || "ChevronLeftIcon"} />,
}));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/chevrons-right.svg", () => ({
  __esModule: true,
  default: (props: any) => <svg {...props} data-testid={props["data-testid"] || "ChevronsRightIcon"} />,
}));

jest.mock("@/components/NavigationTabs/WindowTab", () => ({
  __esModule: true,
  default: ({ title, isActive, onActivate, onClose, canClose, "data-testid": testId }: any) => (
    <div data-testid={testId} data-active={isActive} data-can-close={canClose}>
      <span onClick={onActivate}>{title}</span>
      <button onClick={onClose} data-testid="CloseButton">
        Close
      </button>
    </div>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal", () => ({
  __esModule: true,
  default: ({ open, confirmText, onConfirm, onCancel }: any) =>
    open ? (
      <div data-testid="ConfirmModal">
        <span>{confirmText}</span>
        <button onClick={onConfirm} data-testid="ConfirmButton">
          Confirm
        </button>
        <button onClick={onCancel} data-testid="CancelButton">
          Cancel
        </button>
      </div>
    ) : null,
}));

jest.mock("@/components/NavigationTabs/MenuTabs", () => ({
  __esModule: true,
  default: ({ anchorEl, onClose, onSelect, "data-testid": testId }: any) =>
    anchorEl ? (
      <div data-testid={testId}>
        MenuOpen
        <button onClick={onClose} data-testid="CloseMenu">
          CloseMenu
        </button>
        <button onClick={() => onSelect("window-id")} data-testid="SelectMenuItem">
          SelectMenuItem
        </button>
      </div>
    ) : null,
}));

// useWindowStore is not mocked — we use setState directly

jest.mock("@/contexts/tabs", () => ({
  useTabs: jest.fn(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: jest.fn(),
}));

jest.mock("@/hooks/useMetadataContext", () => ({
  useMetadataContext: jest.fn(),
}));

// Import the mock after it's defined
import { useMetadataContext } from "../../../hooks/useMetadataContext";

describe("WindowTabs", () => {
  const mockUseTabs = useTabs as jest.Mock;
  const mockUseTranslation = useTranslation as jest.Mock;
  const mockUseMetadataContext = useMetadataContext as jest.Mock;

  const mockCleanupWindow = jest.fn();
  const mockSetWindowActive = jest.fn();
  const mockSetAllWindowsInactive = jest.fn();
  const mockHandleScrollLeft = jest.fn();
  const mockHandleScrollRight = jest.fn();

  /** Helper: set Zustand store state and spy on actions */
  const setWindowStoreState = (windows: Record<string, any> = {}) => {
    useWindowStore.setState({
      windows,
      cleanupWindow: mockCleanupWindow,
      setWindowActive: mockSetWindowActive,
      setAllWindowsInactive: mockSetAllWindowsInactive,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });

    // Default: no windows (home route)
    setWindowStoreState({});

    mockUseTabs.mockReturnValue({
      containerRef: { current: null },
      windowsContainerRef: { current: null },
      tabRefs: { current: {} },
      showLeftScrollButton: false,
      showRightScrollButton: false,
      showRightMenuButton: false,
      handleScrollLeft: mockHandleScrollLeft,
      handleScrollRight: mockHandleScrollRight,
    });

    mockUseMetadataContext.mockReturnValue({
      windowsData: {},
    });
  });

  it("renders home button correctly when isHomeRoute is true", () => {
    render(<WindowTabs />);
    const homeButton = screen.getByTestId("IconButton__c8117d"); // The first one is home
    expect(homeButton).toBeInTheDocument();
    // Check for active class or style if possible, but we mocked className.
    // In the component: className={`... ${isHomeRoute ? "bg-(--color-etendo-main) text-(--color-etendo-contrast-text)" : ""}`}
    expect(homeButton.className).toContain("bg-(--color-etendo-main)");
  });

  it("renders home button correctly when isHomeRoute is false", () => {
    setWindowStoreState({
      w1: {
        windowIdentifier: "w1",
        title: "W1",
        isActive: true,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w1",
        initialized: true,
      },
    });
    render(<WindowTabs />);
    const homeButton = screen.getAllByTestId("IconButton__c8117d")[0];
    expect(homeButton.className).not.toContain("bg-(--color-etendo-main) text-(--color-etendo-contrast-text)");
  });

  it("calls setAllWindowsInactive when home button is clicked", () => {
    render(<WindowTabs />);
    const homeButton = screen.getAllByTestId("IconButton__c8117d")[0];
    fireEvent.click(homeButton);
    expect(mockSetAllWindowsInactive).toHaveBeenCalled();
  });

  it("renders window tabs", () => {
    setWindowStoreState({
      w1: {
        windowIdentifier: "w1",
        title: "Window 1",
        isActive: true,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w1",
        initialized: true,
      },
      w2: {
        windowIdentifier: "w2",
        title: "Window 2",
        isActive: false,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w2",
        initialized: true,
      },
    });

    render(<WindowTabs />);

    const tabs = screen.getAllByTestId("WindowTab__c8117d");
    expect(tabs).toHaveLength(2);
    expect(screen.getByText("Window 1")).toBeInTheDocument();
    expect(screen.getByText("Window 2")).toBeInTheDocument();
  });

  it("activates window when tab is clicked", () => {
    setWindowStoreState({
      w1: {
        windowIdentifier: "w1",
        title: "Window 1",
        isActive: false,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w1",
        initialized: true,
      },
    });

    render(<WindowTabs />);

    fireEvent.click(screen.getByText("Window 1"));
    expect(mockSetWindowActive).toHaveBeenCalledWith({ windowIdentifier: "w1" });
  });

  it("closes window when close button is clicked", () => {
    setWindowStoreState({
      w1: {
        windowIdentifier: "w1",
        title: "Window 1",
        isActive: true,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w1",
        initialized: true,
      },
      w2: {
        windowIdentifier: "w2",
        title: "Window 2",
        isActive: false,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w2",
        initialized: true,
      },
    });

    render(<WindowTabs />);

    const closeButtons = screen.getAllByTestId("CloseButton");
    fireEvent.click(closeButtons[0]); // Close w1

    expect(mockCleanupWindow).toHaveBeenCalledWith("w1");
  });

  it("optimistically removes window from view when closed", async () => {
    setWindowStoreState({
      w1: {
        windowIdentifier: "w1",
        title: "Window 1",
        isActive: true,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w1",
        initialized: true,
      },
    });

    const { rerender } = render(<WindowTabs />);

    expect(screen.getByText("Window 1")).toBeInTheDocument();

    const closeButton = screen.getByTestId("CloseButton");
    fireEvent.click(closeButton);

    // Should be removed immediately due to optimistic update
    expect(screen.queryByText("Window 1")).not.toBeInTheDocument();
    expect(mockCleanupWindow).toHaveBeenCalledWith("w1");

    // Simulate prop update where window is actually removed
    setWindowStoreState({});
    rerender(<WindowTabs />);
    expect(screen.queryByText("Window 1")).not.toBeInTheDocument();
  });

  it("shows scroll buttons when enabled in useTabs", () => {
    mockUseTabs.mockReturnValue({
      ...mockUseTabs(),
      showLeftScrollButton: true,
      showRightScrollButton: true,
    });

    render(<WindowTabs />);

    expect(screen.getByTestId("ChevronLeftIcon__c8117d")).toBeInTheDocument();
    expect(screen.getByTestId("ChevronRightIcon__c8117d")).toBeInTheDocument();
  });

  it("calls scroll handlers when scroll buttons are clicked", () => {
    mockUseTabs.mockReturnValue({
      ...mockUseTabs(),
      showLeftScrollButton: true,
      showRightScrollButton: true,
    });

    render(<WindowTabs />);

    const leftButton = screen.getByTestId("ChevronLeftIcon__c8117d").closest("button");
    const rightButton = screen.getByTestId("ChevronRightIcon__c8117d").closest("button");

    fireEvent.click(leftButton!);
    expect(mockHandleScrollLeft).toHaveBeenCalled();

    fireEvent.click(rightButton!);
    expect(mockHandleScrollRight).toHaveBeenCalled();
  });

  it("shows menu button when enabled in useTabs", () => {
    mockUseTabs.mockReturnValue({
      ...mockUseTabs(),
      showRightMenuButton: true,
    });

    render(<WindowTabs />);

    expect(screen.getByTestId("ChevronsRightIcon__c8117d")).toBeInTheDocument();
  });

  it("opens and closes menu", () => {
    mockUseTabs.mockReturnValue({
      ...mockUseTabs(),
      showRightMenuButton: true,
    });

    render(<WindowTabs />);

    const menuButton = screen.getByTestId("ChevronsRightIcon__c8117d").closest("button");
    fireEvent.click(menuButton!);

    expect(screen.getByTestId("MenuTabs__c8117d")).toBeInTheDocument();
    expect(screen.getByText("MenuOpen")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("CloseMenu"));
    expect(screen.queryByText("MenuOpen")).not.toBeInTheDocument();
  });

  it("selects window from menu", () => {
    mockUseTabs.mockReturnValue({
      ...mockUseTabs(),
      showRightMenuButton: true,
    });

    render(<WindowTabs />);

    const menuButton = screen.getByTestId("ChevronsRightIcon__c8117d").closest("button");
    fireEvent.click(menuButton!);

    fireEvent.click(screen.getByTestId("SelectMenuItem"));
    expect(mockSetWindowActive).toHaveBeenCalledWith({ windowIdentifier: "window-id" });
  });

  it("renders separator between tabs correctly", () => {
    setWindowStoreState({
      w1: {
        windowIdentifier: "w1",
        title: "W1",
        isActive: true,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w1",
        initialized: true,
      },
      w2: {
        windowIdentifier: "w2",
        title: "W2",
        isActive: false,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w2",
        initialized: true,
      },
      w3: {
        windowIdentifier: "w3",
        title: "W3",
        isActive: false,
        tabs: {},
        navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: false },
        windowId: "w3",
        initialized: true,
      },
    });

    const { container } = render(<WindowTabs />);

    // We can check for the separator div class
    // className="h-4 w-0.5 bg-(--color-baseline-100) opacity-10 mx-0.5"
    const separators = container.querySelectorAll(".h-4.w-0\\.5");
    // activeIndex = 0.
    // i=0: showSeparator = (0 !== -1 && 0 !== 0) = False.
    // i=1: showSeparator = (1 !== -1 && 1 !== 0) = True. Separator after W2.
    // i=2: Last element, never has separator after it.

    expect(separators.length).toBe(1);
  });
});
