import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AppBreadcrumb from "../Breadcrums";
import { renderWithTheme } from "../../test-utils/test-theme-provider";
import { useCurrentRecord } from "@/hooks/useCurrentRecord";
import { useTableStatePersistenceTab } from "@/hooks/useTableStatePersistenceTab";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/window/test-window"),
}));

jest.mock("../../hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("../../hooks/useMetadataContext", () => ({
  useMetadataContext: () => ({
    window: { window$_identifier: "test-window-id", name: "Test Window" },
    windowId: "test-window-id",
    windowIdentifier: "test-window-identifier",
  }),
}));

const mockSetAllWindowsInactive = jest.fn();
const mockSetActiveLevel = jest.fn();
const mockSetFocus = jest.fn();
const mockUseWindowContext = jest.fn();
let mockActiveFocusId: string | null = null;

jest.mock("@/contexts/window", () => ({
  useWindowContext: (...args: any[]) => mockUseWindowContext(...args),
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({
    graph: {
      clear: jest.fn(),
      clearSelected: jest.fn(),
    },
  }),
}));

jest.mock("@/hooks/useCurrentRecord");
jest.mock("@/hooks/useTableStatePersistenceTab");

jest.mock("@/contexts/focus", () => ({
  useFocusContext: () => ({
    activeFocusId: mockActiveFocusId,
    setFocus: mockSetFocus,
  }),
}));

// Mock Component Library Breadcrumb to simplify assertions
jest.mock("@workspaceui/componentlibrary/src/components/Breadcrums", () => ({
  __esModule: true,
  default: ({
    items,
    onHomeClick,
    onBackClick,
  }: {
    items: { id: string; label: string; onClick?: () => void }[];
    onHomeClick: () => void;
    onBackClick?: () => void;
  }) => (
    <div data-testid="breadcrumb-lib">
      <button onClick={onHomeClick} data-testid="home-button">
        Home
      </button>
      {onBackClick && (
        <button onClick={onBackClick} data-testid="back-button">
          Back
        </button>
      )}
      {items.map((item) => (
        <span key={item.id} onClick={item.onClick} data-testid={`item-${item.id}`}>
          {item.label}
        </span>
      ))}
    </div>
  ),
}));

const mockedUseCurrentRecord = useCurrentRecord as jest.MockedFunction<typeof useCurrentRecord>;
const mockedUseTableStatePersistenceTab = useTableStatePersistenceTab as jest.MockedFunction<
  typeof useTableStatePersistenceTab
>;

const mockTabs = [
  [
    {
      id: "tab-1",
      window: "test-window-id",
      window$_identifier: "test-window-id",
      tabLevel: 0,
    } as any,
  ],
];

const level1TabId = "tab-level1";
const level2TabId = "tab-level2";
const sharedTwoLevelTabs = [...mockTabs, [{ id: level1TabId, window: "test-window-id", tabLevel: 1 } as any]];
const sharedThreeLevelTabs = [
  ...mockTabs,
  [{ id: level1TabId, window: "test-window-id", tabLevel: 1 } as any],
  [{ id: level2TabId, window: "test-window-id", tabLevel: 2 } as any],
];

const buildWindowContextValue = (overrides: Record<string, any> = {}) => ({
  activeWindow: { tabs: {}, windowIdentifier: "test-window-identifier" },
  setAllWindowsInactive: mockSetAllWindowsInactive,
  getNavigationState: jest.fn(() => undefined),
  getTabFormState: jest.fn(() => undefined),
  clearTabFormState: jest.fn(),
  ...overrides,
});

// Helper: return a fixed-record mock for 5 hook calls.
// recordBySlot: index → record value (undefined for unset slots)
const mockUseCurrentRecordCalls = (recordBySlot: Record<number, any>) => {
  for (let i = 0; i < 5; i++) {
    const record = recordBySlot[i] ?? undefined;
    mockedUseCurrentRecord.mockReturnValueOnce({ record, loading: false, error: undefined } as any);
  }
};

const setupTabsAndWindow = ({
  activeTabs = [[0, "tab-1"]],
  activeLevels = [0],
  tabsContext = {},
  windowContextOverrides = {},
}: {
  activeTabs?: [number, string][];
  activeLevels?: number[];
  tabsContext?: Record<string, any>;
  windowContextOverrides?: Record<string, any>;
} = {}) => {
  mockedUseTableStatePersistenceTab.mockReturnValue({
    setActiveLevel: mockSetActiveLevel,
    activeTabsByLevel: new Map<number, string>(activeTabs),
    activeLevels,
  } as any);

  mockUseWindowContext.mockReturnValue(
    buildWindowContextValue({
      activeWindow: {
        tabs: tabsContext,
        windowIdentifier: "test-window-identifier",
      },
      ...windowContextOverrides,
    })
  );
};

describe("AppBreadcrumb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveFocusId = null;

    setupTabsAndWindow();

    mockedUseCurrentRecord.mockReturnValue({ record: undefined, loading: false, error: undefined } as any);

    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/window/test-window-id");
  });

  it("renders the breadcrumb wrapper element", () => {
    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);
    expect(screen.getByTestId("breadcrumb-lib")).toBeInTheDocument();
  });

  it("renders the window title from window$_identifier", () => {
    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);
    expect(screen.getByText("test-window-id")).toBeInTheDocument();
  });

  it("renders new record breadcrumb when pathname includes /NewRecord", () => {
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/window/test-window-id/NewRecord");

    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    expect(screen.getByText("breadcrumb.newRecord")).toBeInTheDocument();
  });

  it("does NOT render new record breadcrumb on non-NewRecord path", () => {
    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);
    expect(screen.queryByText("breadcrumb.newRecord")).not.toBeInTheDocument();
  });

  it("calls setAllWindowsInactive when home button is clicked", () => {
    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    fireEvent.click(screen.getByTestId("home-button"));

    expect(mockSetAllWindowsInactive).toHaveBeenCalledTimes(1);
  });

  it("calls setActiveLevel(0) when window title item is clicked", () => {
    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    fireEvent.click(screen.getByTestId("item-test-window-id"));

    expect(mockSetActiveLevel).toHaveBeenCalledWith(0);
  });

  it("does not reset tab form state when window title is clicked", () => {
    const mockClearTabFormState = jest.fn();
    setupTabsAndWindow({ windowContextOverrides: { clearTabFormState: mockClearTabFormState } });

    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    fireEvent.click(screen.getByTestId("item-test-window-id"));

    expect(mockClearTabFormState).not.toHaveBeenCalled();
  });

  it("does not render a record item when no record is selected in the active window", () => {
    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    const items = screen.getAllByTestId(/^item-/);
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("test-window-id");
  });

  it("renders a level0 record item when selectedRecord is set and record has identifier", () => {
    setupTabsAndWindow({ tabsContext: { "tab-1": { selectedRecord: "record-abc" } } });
    mockUseCurrentRecordCalls({ 0: { _identifier: "My Record" } });

    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    expect(screen.getByTestId("item-level0-tab-1")).toBeInTheDocument();
    expect(screen.getByText("My Record")).toBeInTheDocument();
  });

  it("calls setFocus with level0TabId when level0 record item is clicked", () => {
    setupTabsAndWindow({ tabsContext: { "tab-1": { selectedRecord: "record-abc" } } });
    mockUseCurrentRecordCalls({ 0: { _identifier: "My Record" } });

    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    fireEvent.click(screen.getByTestId("item-level0-tab-1"));

    expect(mockSetFocus).toHaveBeenCalledWith("tab-1");
  });

  describe("Two-level scenarios (Level 0 and Level 1)", () => {
    beforeEach(() => {
      setupTabsAndWindow({
        activeTabs: [
          [0, "tab-1"],
          [1, level1TabId],
        ],
        activeLevels: [0, 1],
        tabsContext: { [level1TabId]: { selectedRecord: "level1-record-id" } },
      });
      mockUseCurrentRecordCalls({ 1: { _identifier: "Level1 Item" } });
    });

    it("renders a level1 record item when level1TabId is active and record has identifier", () => {
      renderWithTheme(<AppBreadcrumb allTabs={sharedTwoLevelTabs} />);
      expect(screen.getByTestId(`item-level1-${level1TabId}`)).toBeInTheDocument();
      expect(screen.getByText("Level1 Item")).toBeInTheDocument();
    });

    it("calls setFocus with level1TabId when level1 record item is clicked", () => {
      renderWithTheme(<AppBreadcrumb allTabs={sharedTwoLevelTabs} />);
      fireEvent.click(screen.getByTestId(`item-level1-${level1TabId}`));
      expect(mockSetFocus).toHaveBeenCalledWith(level1TabId);
    });

    it("does not render level1 item when level1TabId is active but record has no identifier", () => {
      mockedUseCurrentRecord.mockReset();
      mockedUseCurrentRecord.mockReturnValue({ record: undefined, loading: false, error: undefined } as any);
      renderWithTheme(<AppBreadcrumb allTabs={sharedTwoLevelTabs} />);
      expect(screen.queryByTestId(`item-level1-${level1TabId}`)).not.toBeInTheDocument();
    });
  });

  describe("Three-level scenarios (Level 0, Level 1, and Level 2)", () => {
    beforeEach(() => {
      setupTabsAndWindow({
        activeTabs: [
          [0, "tab-1"],
          [1, level1TabId],
          [2, level2TabId],
        ],
        activeLevels: [1, 2],
        tabsContext: {
          "tab-1": { selectedRecord: "record-0" },
          [level1TabId]: { selectedRecord: "record-1" },
          [level2TabId]: { selectedRecord: "record-2" },
        },
      });
      mockUseCurrentRecordCalls({
        0: { _identifier: "Level0 Item" },
        1: { _identifier: "Level1 Item" },
        2: { _identifier: "Level2 Item" },
      });
    });

    it("renders level0, level1, and level2 record items when all levels are active with selected records", () => {
      renderWithTheme(<AppBreadcrumb allTabs={sharedThreeLevelTabs} />);
      expect(screen.getByTestId("item-level0-tab-1")).toBeInTheDocument();
      expect(screen.getByText("Level0 Item")).toBeInTheDocument();
      expect(screen.getByTestId(`item-level1-${level1TabId}`)).toBeInTheDocument();
      expect(screen.getByText("Level1 Item")).toBeInTheDocument();
      expect(screen.getByTestId(`item-level2-${level2TabId}`)).toBeInTheDocument();
      expect(screen.getByText("Level2 Item")).toBeInTheDocument();
    });

    it("calls setActiveLevel(level+1, false) when clicking a breadcrumb item at a level not currently visible", () => {
      renderWithTheme(<AppBreadcrumb allTabs={sharedThreeLevelTabs} />);
      fireEvent.click(screen.getByTestId("item-level0-tab-1"));
      expect(mockSetFocus).toHaveBeenCalledWith("tab-1");
      expect(mockSetActiveLevel).toHaveBeenCalledWith(1, false);
    });

    it("does not call setActiveLevel when clicking a breadcrumb item already in activeLevels", () => {
      renderWithTheme(<AppBreadcrumb allTabs={sharedThreeLevelTabs} />);
      fireEvent.click(screen.getByTestId(`item-level1-${level1TabId}`));
      expect(mockSetFocus).toHaveBeenCalledWith(level1TabId);
      expect(mockSetActiveLevel).not.toHaveBeenCalledWith(2, false);
    });

    it("skips levels that have no selectedRecord while rendering levels that do", () => {
      // Clear mocks to override beforeEach
      mockedUseCurrentRecord.mockReset();
      setupTabsAndWindow({
        activeTabs: [
          [0, "tab-1"],
          [1, level1TabId],
          [2, level2TabId],
        ],
        activeLevels: [1, 2],
        tabsContext: {
          "tab-1": { selectedRecord: "record-0" },
          [level2TabId]: { selectedRecord: "record-2" },
        },
      });
      mockUseCurrentRecordCalls({
        0: { _identifier: "Level0 Item" },
        2: { _identifier: "Level2 Item" },
      });

      renderWithTheme(<AppBreadcrumb allTabs={sharedThreeLevelTabs} />);
      expect(screen.getByTestId("item-level0-tab-1")).toBeInTheDocument();
      expect(screen.queryByTestId(`item-level1-${level1TabId}`)).not.toBeInTheDocument();
      expect(screen.getByTestId(`item-level2-${level2TabId}`)).toBeInTheDocument();
    });
  });

  it("renders level1 record item via fallback when level1 tab is not in activeTabsByLevel but has a selectedRecord", () => {
    const fallbackTabId = "tab-level1-auto";
    setupTabsAndWindow({
      tabsContext: {
        "tab-1": { selectedRecord: "record-0" },
        [fallbackTabId]: { selectedRecord: "auto-record-1" },
      },
    });

    const fallbackTabs = [...mockTabs, [{ id: fallbackTabId, window: "test-window-id", tabLevel: 1 } as any]];
    mockUseCurrentRecordCalls({
      0: { _identifier: "Level0 Item" },
      1: { _identifier: "Auto Level1 Item" },
    });

    renderWithTheme(<AppBreadcrumb allTabs={fallbackTabs} />);

    expect(screen.getByTestId(`item-level1-${fallbackTabId}`)).toBeInTheDocument();
    expect(screen.getByText("Auto Level1 Item")).toBeInTheDocument();
  });

  describe("Back button", () => {
    it("Case 1: clears form state of focused level-1 tab when it is in Form mode", () => {
      mockActiveFocusId = level1TabId;
      const mockClearTabFormState = jest.fn();
      const mockGetTabFormState = jest.fn((_, tabId) => (tabId === level1TabId ? { mode: "form" } : undefined));

      setupTabsAndWindow({
        activeTabs: [
          [0, "tab-1"],
          [1, level1TabId],
        ],
        activeLevels: [0, 1],
        windowContextOverrides: {
          getTabFormState: mockGetTabFormState,
          clearTabFormState: mockClearTabFormState,
        },
      });

      renderWithTheme(<AppBreadcrumb allTabs={sharedTwoLevelTabs} />);

      fireEvent.click(screen.getByTestId("back-button"));

      expect(mockClearTabFormState).toHaveBeenCalledWith("test-window-identifier", level1TabId);
      expect(mockSetAllWindowsInactive).not.toHaveBeenCalled();
    });

    it("Case 2: clears form state of focused level-0 tab when it is in Form mode", () => {
      mockActiveFocusId = "tab-1";
      const mockClearTabFormState = jest.fn();
      const mockGetTabFormState = jest.fn((_, tabId) => (tabId === "tab-1" ? { mode: "form" } : undefined));

      setupTabsAndWindow({
        windowContextOverrides: {
          getTabFormState: mockGetTabFormState,
          clearTabFormState: mockClearTabFormState,
        },
      });

      renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

      fireEvent.click(screen.getByTestId("back-button"));

      expect(mockClearTabFormState).toHaveBeenCalledWith("test-window-identifier", "tab-1");
      expect(mockSetAllWindowsInactive).not.toHaveBeenCalled();
    });

    it("Case 3: calls setAllWindowsInactive when focused tab is level-0 in Grid/Table mode", () => {
      mockActiveFocusId = "tab-1";
      const mockClearTabFormState = jest.fn();
      const mockGetTabFormState = jest.fn(() => ({ mode: "table" }));

      setupTabsAndWindow({
        windowContextOverrides: {
          getTabFormState: mockGetTabFormState,
          clearTabFormState: mockClearTabFormState,
        },
      });

      renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

      fireEvent.click(screen.getByTestId("back-button"));

      expect(mockSetAllWindowsInactive).toHaveBeenCalledTimes(1);
      expect(mockClearTabFormState).not.toHaveBeenCalled();
    });

    it("does nothing when focused tab is level > 0 in Grid/Table mode", () => {
      mockActiveFocusId = level1TabId;
      const mockClearTabFormState = jest.fn();
      const mockGetTabFormState = jest.fn(() => ({ mode: "table" }));

      setupTabsAndWindow({
        activeTabs: [
          [0, "tab-1"],
          [1, level1TabId],
        ],
        activeLevels: [0, 1],
        windowContextOverrides: {
          getTabFormState: mockGetTabFormState,
          clearTabFormState: mockClearTabFormState,
        },
      });

      renderWithTheme(<AppBreadcrumb allTabs={sharedTwoLevelTabs} />);

      fireEvent.click(screen.getByTestId("back-button"));

      expect(mockClearTabFormState).not.toHaveBeenCalled();
      expect(mockSetAllWindowsInactive).not.toHaveBeenCalled();
    });
  });
});
