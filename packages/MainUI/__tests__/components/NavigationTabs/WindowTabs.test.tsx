import { render, screen, fireEvent } from "@testing-library/react";
import WindowTabs from "@/components/NavigationTabs/WindowTabs";
import { useWindowContext } from "@/contexts/window";
import { useTabs } from "@/contexts/tabs";
import { useTranslation } from "@/hooks/useTranslation";

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

jest.mock("@/contexts/window", () => ({
  useWindowContext: jest.fn(),
}));

jest.mock("@/contexts/tabs", () => ({
  useTabs: jest.fn(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: jest.fn(),
}));

describe("WindowTabs", () => {
  const mockUseWindowContext = useWindowContext as jest.Mock;
  const mockUseTabs = useTabs as jest.Mock;
  const mockUseTranslation = useTranslation as jest.Mock;

  const mockCleanupWindow = jest.fn();
  const mockSetWindowActive = jest.fn();
  const mockSetAllWindowsInactive = jest.fn();
  const mockHandleScrollLeft = jest.fn();
  const mockHandleScrollRight = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });

    mockUseWindowContext.mockReturnValue({
      windows: [],
      isHomeRoute: true,
      cleanupWindow: mockCleanupWindow,
      setWindowActive: mockSetWindowActive,
      setAllWindowsInactive: mockSetAllWindowsInactive,
    });

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
    mockUseWindowContext.mockReturnValue({
      ...mockUseWindowContext(),
      isHomeRoute: false,
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
    const windows = [
      { windowIdentifier: "w1", title: "Window 1", isActive: true },
      { windowIdentifier: "w2", title: "Window 2", isActive: false },
    ];
    mockUseWindowContext.mockReturnValue({
      ...mockUseWindowContext(),
      windows,
    });

    render(<WindowTabs />);

    const tabs = screen.getAllByTestId("WindowTab__c8117d");
    expect(tabs).toHaveLength(2);
    expect(screen.getByText("Window 1")).toBeInTheDocument();
    expect(screen.getByText("Window 2")).toBeInTheDocument();
  });

  it("activates window when tab is clicked", () => {
    const windows = [{ windowIdentifier: "w1", title: "Window 1", isActive: false }];
    mockUseWindowContext.mockReturnValue({
      ...mockUseWindowContext(),
      windows,
    });

    render(<WindowTabs />);

    fireEvent.click(screen.getByText("Window 1"));
    expect(mockSetWindowActive).toHaveBeenCalledWith({ windowIdentifier: "w1" });
  });

  it("closes window when close button is clicked", () => {
    const windows = [
      { windowIdentifier: "w1", title: "Window 1", isActive: true },
      { windowIdentifier: "w2", title: "Window 2", isActive: false },
    ];
    mockUseWindowContext.mockReturnValue({
      ...mockUseWindowContext(),
      windows,
    });

    render(<WindowTabs />);

    const closeButtons = screen.getAllByTestId("CloseButton");
    fireEvent.click(closeButtons[0]); // Close w1

    expect(mockCleanupWindow).toHaveBeenCalledWith("w1");
  });

  it("optimistically removes window from view when closed", async () => {
    const windows = [{ windowIdentifier: "w1", title: "Window 1", isActive: true }];
    mockUseWindowContext.mockReturnValue({
      ...mockUseWindowContext(),
      windows,
    });

    const { rerender } = render(<WindowTabs />);

    expect(screen.getByText("Window 1")).toBeInTheDocument();

    const closeButton = screen.getByTestId("CloseButton");
    fireEvent.click(closeButton);

    // Should be removed immediately due to optimistic update
    expect(screen.queryByText("Window 1")).not.toBeInTheDocument();
    expect(mockCleanupWindow).toHaveBeenCalledWith("w1");

    // Simulate prop update where window is actually removed
    mockUseWindowContext.mockReturnValue({
      ...mockUseWindowContext(),
      windows: [],
    });
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
    // Logic: showSeparator = index !== activeIndex - 1 && index !== activeIndex;
    // If we have 3 tabs: [0, 1, 2]. Active is 1.
    // Index 0: activeIndex=1. 0 !== 1-1 (0) -> False. No separator.
    // Index 1: activeIndex=1. 1 !== 1 -> False. No separator.
    // Index 2: activeIndex=1. 2 !== 0 && 2 !== 1 -> True. Separator after 2?
    // Wait, the separator is rendered AFTER the tab if index < length - 1.

    // Let's try: Active is 0.
    // Index 0: activeIndex=0. 0 !== -1 && 0 !== 0 -> False.
    // Index 1: activeIndex=0. 1 !== -1 && 1 !== 0 -> True. Separator after 1?

    const windows = [
      { windowIdentifier: "w1", title: "W1", isActive: true }, // Index 0
      { windowIdentifier: "w2", title: "W2", isActive: false }, // Index 1
      { windowIdentifier: "w3", title: "W3", isActive: false }, // Index 2
    ];
    mockUseWindowContext.mockReturnValue({
      ...mockUseWindowContext(),
      windows,
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
