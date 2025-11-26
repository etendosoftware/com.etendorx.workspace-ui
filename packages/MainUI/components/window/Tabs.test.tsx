import { render, screen } from "@testing-library/react";
import TabsComponent from "./Tabs";
import WindowProvider from "@/contexts/window";

// Mock Next.js navigation hooks
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
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
  const tabs = [
    { id: "t1", name: "Tab 1", tabLevel: 1 },
    { id: "t2", name: "Tab 2", tabLevel: 2 },
  ] as any[];

  beforeEach(() => {
    mockReplace.mockClear();
    // Clear all search params
    Array.from(mockSearchParams.keys()).forEach((key) => mockSearchParams.delete(key));

    // Initialize a window in URL params
    mockSearchParams.set("w_window1", "active");
    mockSearchParams.set("wi_window1", "window1");
    mockSearchParams.set("o_window1", "1");
  });

  it("renders skeleton content when transition is pending", () => {
    const TabsAsAny = TabsComponent as any;
    render(
      <WindowProvider>
        <TabsAsAny tabs={tabs} />
      </WindowProvider>
    );

    expect(screen.getByTestId("tab-container")).toBeInTheDocument();
    // When pending, the skeleton container with animate-pulse should be present
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });
});
