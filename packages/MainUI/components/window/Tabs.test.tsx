import { render, screen } from "@testing-library/react";
import TabsComponent from "./Tabs";
import WindowProvider from "@/contexts/window";

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
  useRouter: () => createMockRouter(),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/window",
}));

// Mock subcomponents to reduce rendering complexity
jest.mock("@/components/window/SubTabsSwitch", () => ({
  SubTabsSwitch: () => <div data-testid="subtabs" />,
}));

jest.mock("@/components/window/TabContainer", () => ({
  TabContainer: ({ children }: any) => <div data-testid="tab-container">{children}</div>,
}));

jest.mock("@/components/window/Tab", () => ({
  Tab: () => <div data-testid="tab-content" />,
}));

jest.mock("@/contexts/tab", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("@workspaceui/componentlibrary/src/components/ResizeHandle", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({ activeLevels: [1], setActiveLevel: jest.fn() }),
}));

jest.mock("@/hooks/useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => ({
    activeLevels: [1],
    setActiveLevel: jest.fn(),
  }),
}));

// Force React.useTransition to always be pending
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, useTransition: () => [true, (cb: any) => cb()] };
});

describe("Tabs - pending state skeleton", () => {
  const tabs = createMockTabs();

  beforeEach(() => {
    mockReplace.mockClear();
    clearSearchParams();
    setupWindowParams();
  });

  it("renders skeleton content when transition is pending", () => {
    renderTabsComponent(tabs);

    expect(screen.getByTestId("tab-container")).toBeInTheDocument();
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });
});
