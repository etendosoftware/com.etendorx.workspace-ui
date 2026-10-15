import { render, screen, fireEvent } from "@testing-library/react";
import TabsComponent from "./Tabs";
import WindowProvider from "@/contexts/window";
import { useWindowStore } from "@/stores/windowStore";

/**
 * Test helpers
 */

// Mock Next.js navigation hooks
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

const createMockRouter = () => ({
  replace: mockReplace,
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
});

const mockRouter = createMockRouter();

const WINDOW_IDENTIFIER = "window1";
/** Height the mocked resize handle reports when a drag ends (double click in the mock). */
const DRAGGED_HEIGHT = 30;

const createMockTabs = (count = 2) =>
  Array.from({ length: count }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Tab ${i + 1}`,
    tabLevel: i + 1,
  })) as any[];

const setupWindowParams = (windowId = "window1") => {
  mockSearchParams.set(`w_${windowId}`, "active");
  mockSearchParams.set(`wi_${windowId}`, windowId);
  mockSearchParams.set(`o_${windowId}`, "1");
};

const clearSearchParams = () => {
  Array.from(mockSearchParams.keys()).forEach((key) => mockSearchParams.delete(key));
};

const renderTabsComponent = (tabs: any[]) => {
  const TabsAsAny = TabsComponent as any;
  return render(
    <WindowProvider>
      <TabsAsAny tabs={tabs} />
    </WindowProvider>
  );
};

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => mockRouter),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/window",
}));

// Mock subcomponents to reduce rendering complexity
jest.mock("@/components/window/SubTabsSwitch", () => ({
  SubTabsSwitch: ({ onClick, tabs: subTabs, "data-testid": testId }: any) => (
    <div data-testid={testId} onClick={() => subTabs?.length > 1 && onClick?.(subTabs[1])} />
  ),
}));

jest.mock("@/components/window/TabContainer", () => ({
  TabContainer: ({ children, customHeight }: any) => (
    <div data-testid="tab-container" data-height={customHeight}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/window/Tab", () => ({
  Tab: ({ "data-testid": testId }: any) => <div data-testid={testId} />,
}));

jest.mock("@/contexts/tab", () => ({
  __esModule: true,
  default: ({ children, "data-testid": testId }: any) => <div data-testid={testId}>{children}</div>,
}));

jest.mock("@workspaceui/componentlibrary/src/components/ResizeHandle", () => ({
  __esModule: true,
  default: ({ children, "data-testid": testId, onHeightChangeEnd }: any) => (
    <div data-testid={testId} onDoubleClick={() => onHeightChangeEnd?.(DRAGGED_HEIGHT)}>
      {children}
    </div>
  ),
}));

jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowIdentifier: () => WINDOW_IDENTIFIER,
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({ activeLevels: [1], setActiveLevel: jest.fn() }),
}));

jest.mock("@/hooks/useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => ({
    activeLevels: [1],
    setActiveLevel: jest.fn(),
    setActiveTabsByLevel: jest.fn(),
  }),
}));

// Force React.useTransition to always be pending
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, useTransition: jest.fn(() => [false, (cb: any) => cb()]) };
});

describe("Tabs - pending state skeleton", () => {
  const tabs = createMockTabs();

  beforeEach(() => {
    mockReplace.mockClear();
    clearSearchParams();
    setupWindowParams();
  });

  it("renders pending opacity style when transition is pending", () => {
    // Modify mock for this specific test
    const { useTransition } = jest.requireMock("react");
    (useTransition as jest.Mock).mockReturnValue([true, jest.fn()]);

    renderTabsComponent(tabs);

    expect(screen.getByTestId("tab-container")).toBeInTheDocument();
    // Click second tab: activeTabId updates immediately, but startTransition is a no-op
    // so current.id stays as tabs[0].id → isPending && current.id !== activeTabId → skeleton shows
    fireEvent.click(screen.getByTestId(`SubTabsSwitch__${tabs[0].id}`));
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });
});

describe("Tabs - data-testid verification", () => {
  const tabs = createMockTabs();

  beforeEach(() => {
    mockReplace.mockClear();
    clearSearchParams();
    setupWindowParams();
  });

  it("verifies data-testid on TabContextProvider and Tab", () => {
    renderTabsComponent(tabs);

    const tabId = tabs[0].id;
    expect(screen.getByTestId(`TabContextProvider__${tabId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`Tab__${tabId}`)).toBeInTheDocument();
  });

  it("verifies data-testid on SubTabsSwitch", () => {
    renderTabsComponent(tabs);

    const tabId = tabs[0].id;
    expect(screen.getByTestId(`SubTabsSwitch__${tabId}`)).toBeInTheDocument();
  });
});

describe("Tabs - parent/child split height", () => {
  const tabs = createMockTabs();
  const getHeight = () => screen.getByTestId("tab-container").getAttribute("data-height");

  beforeEach(() => {
    const { useTransition } = jest.requireMock("react");
    (useTransition as jest.Mock).mockReturnValue([false, (cb: () => void) => cb()]);
    clearSearchParams();
    setupWindowParams();
    useWindowStore.getState().cleanState();
    useWindowStore.getState().setNavigationActiveLevels(WINDOW_IDENTIFIER, [1]);
  });

  it("starts at the default height", () => {
    renderTabsComponent(tabs);

    expect(getHeight()).toBe("50");
  });

  it("uses the height stored for the tab level", () => {
    useWindowStore.getState().setNavigationSplitHeight(WINDOW_IDENTIFIER, 1, 40);

    renderTabsComponent(tabs);

    expect(getHeight()).toBe("40");
  });

  it("stores the height once the user finishes resizing", () => {
    renderTabsComponent(tabs);

    fireEvent.doubleClick(screen.getByTestId(`ResizeHandle__${tabs[0].id}`));

    expect(useWindowStore.getState().windows[WINDOW_IDENTIFIER].navigation.splitHeights).toEqual({ 1: DRAGGED_HEIGHT });
    expect(getHeight()).toBe(String(DRAGGED_HEIGHT));
  });

  it("keeps the height when switching to a sibling tab", () => {
    const siblingTabs = createMockTabs().map((tab) => ({ ...tab, tabLevel: 1 }));
    useWindowStore.getState().setNavigationSplitHeight(WINDOW_IDENTIFIER, 1, 40);
    renderTabsComponent(siblingTabs);

    fireEvent.click(screen.getByTestId(`SubTabsSwitch__${siblingTabs[0].id}`));

    expect(screen.getByTestId(`SubTabsSwitch__${siblingTabs[1].id}`)).toBeInTheDocument();

    expect(getHeight()).toBe("40");
  });
});
