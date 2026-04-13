/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
const mockClearTabFormState = jest.fn();
const mockSetActiveLevel = jest.fn();
const mockSetFocus = jest.fn();
const mockUseWindowContext = jest.fn();

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
    setFocus: mockSetFocus,
  }),
}));

// Mock Component Library Breadcrumb to simplify assertions
jest.mock("@workspaceui/componentlibrary/src/components/Breadcrums", () => ({
  __esModule: true,
  default: ({
    items,
    onHomeClick,
  }: {
    items: { id: string; label: string; onClick?: () => void }[];
    onHomeClick: () => void;
  }) => (
    <div data-testid="breadcrumb-lib">
      <button onClick={onHomeClick} data-testid="home-button">
        Home
      </button>
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

const buildWindowContextValue = (overrides: Record<string, any> = {}) => ({
  activeWindow: { tabs: {}, windowIdentifier: "test-window-identifier" },
  clearTabFormState: mockClearTabFormState,
  setAllWindowsInactive: mockSetAllWindowsInactive,
  getNavigationState: jest.fn(() => undefined),
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

describe("AppBreadcrumb", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseWindowContext.mockReturnValue(buildWindowContextValue());

    mockedUseCurrentRecord.mockReturnValue({ record: undefined, loading: false, error: undefined } as any);

    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>(),
    } as any);

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

  it("calls clearTabFormState for all active tabs when window title is clicked", () => {
    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>([[0, "tab-1"]]),
    } as any);

    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    fireEvent.click(screen.getByTestId("item-test-window-id"));

    expect(mockClearTabFormState).toHaveBeenCalledWith("test-window-identifier", "tab-1");
  });

  it("does not render a record item when no record is selected in the active window", () => {
    // activeWindow.tabs has no selectedRecord by default (buildWindowContextValue sets tabs: {})
    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    const items = screen.getAllByTestId(/^item-/);
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("test-window-id");
  });

  it("renders a level0 record item when selectedRecord is set and record has identifier", () => {
    const recordId = "record-abc";
    mockUseWindowContext.mockReturnValue(
      buildWindowContextValue({
        activeWindow: {
          tabs: { "tab-1": { selectedRecord: recordId } },
          windowIdentifier: "test-window-identifier",
        },
      })
    );

    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>([[0, "tab-1"]]),
    } as any);

    mockUseCurrentRecordCalls({ 0: { _identifier: "My Record" } });

    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    expect(screen.getByTestId("item-level0-tab-1")).toBeInTheDocument();
    expect(screen.getByText("My Record")).toBeInTheDocument();
  });

  it("calls setFocus with level0TabId when level0 record item is clicked", () => {
    const recordId = "record-abc";
    mockUseWindowContext.mockReturnValue(
      buildWindowContextValue({
        activeWindow: {
          tabs: { "tab-1": { selectedRecord: recordId } },
          windowIdentifier: "test-window-identifier",
        },
      })
    );

    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>([[0, "tab-1"]]),
    } as any);

    mockUseCurrentRecordCalls({ 0: { _identifier: "My Record" } });

    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    fireEvent.click(screen.getByTestId("item-level0-tab-1"));

    expect(mockSetFocus).toHaveBeenCalledWith("tab-1");
  });

  it("renders a level1 record item when level1TabId is active and record has identifier", () => {
    const level1TabId = "tab-level1";
    const level1RecordId = "level1-record-id";

    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>([
        [0, "tab-1"],
        [1, level1TabId],
      ]),
    } as any);

    mockUseWindowContext.mockReturnValue(
      buildWindowContextValue({
        activeWindow: {
          tabs: { [level1TabId]: { selectedRecord: level1RecordId } },
          windowIdentifier: "test-window-identifier",
        },
      })
    );

    // Need level1TabId in allTabs so tabByLevel[1] resolves
    const tabsWithLevel1 = [...mockTabs, [{ id: level1TabId, window: "test-window-id", tabLevel: 1 } as any]];

    mockUseCurrentRecordCalls({ 1: { _identifier: "Level1 Item" } });

    renderWithTheme(<AppBreadcrumb allTabs={tabsWithLevel1} />);

    expect(screen.getByTestId(`item-level1-${level1TabId}`)).toBeInTheDocument();
    expect(screen.getByText("Level1 Item")).toBeInTheDocument();
  });

  it("calls setFocus with level1TabId when level1 record item is clicked", () => {
    const level1TabId = "tab-level1";
    const level1RecordId = "level1-record-id";

    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>([
        [0, "tab-1"],
        [1, level1TabId],
      ]),
    } as any);

    mockUseWindowContext.mockReturnValue(
      buildWindowContextValue({
        activeWindow: {
          tabs: { [level1TabId]: { selectedRecord: level1RecordId } },
          windowIdentifier: "test-window-identifier",
        },
      })
    );

    const tabsWithLevel1 = [...mockTabs, [{ id: level1TabId, window: "test-window-id", tabLevel: 1 } as any]];

    mockUseCurrentRecordCalls({ 1: { _identifier: "Level1 Item" } });

    renderWithTheme(<AppBreadcrumb allTabs={tabsWithLevel1} />);

    fireEvent.click(screen.getByTestId(`item-level1-${level1TabId}`));

    expect(mockSetFocus).toHaveBeenCalledWith(level1TabId);
  });

  it("does not render level1 item when level1TabId is active but record has no identifier", () => {
    const level1TabId = "tab-level1";
    const level1RecordId = "level1-record-id";

    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>([
        [0, "tab-1"],
        [1, level1TabId],
      ]),
    } as any);

    mockUseWindowContext.mockReturnValue(
      buildWindowContextValue({
        activeWindow: {
          tabs: { [level1TabId]: { selectedRecord: level1RecordId } },
          windowIdentifier: "test-window-identifier",
        },
      })
    );

    const tabsWithLevel1 = [...mockTabs, [{ id: level1TabId, window: "test-window-id", tabLevel: 1 } as any]];

    // All 5 calls return no record
    mockedUseCurrentRecord.mockReturnValue({ record: undefined, loading: false, error: undefined } as any);

    renderWithTheme(<AppBreadcrumb allTabs={tabsWithLevel1} />);

    expect(screen.queryByTestId(`item-level1-${level1TabId}`)).not.toBeInTheDocument();
  });

  it("renders level0, level1, and level2 record items when all three levels are active with selected records", () => {
    const level1TabId = "tab-level1";
    const level2TabId = "tab-level2";

    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>([
        [0, "tab-1"],
        [1, level1TabId],
        [2, level2TabId],
      ]),
    } as any);

    mockUseWindowContext.mockReturnValue(
      buildWindowContextValue({
        activeWindow: {
          tabs: {
            "tab-1": { selectedRecord: "record-0" },
            [level1TabId]: { selectedRecord: "record-1" },
            [level2TabId]: { selectedRecord: "record-2" },
          },
          windowIdentifier: "test-window-identifier",
        },
      })
    );

    const allTabsThreeLevels = [
      ...mockTabs,
      [{ id: level1TabId, window: "test-window-id", tabLevel: 1 } as any],
      [{ id: level2TabId, window: "test-window-id", tabLevel: 2 } as any],
    ];

    mockUseCurrentRecordCalls({
      0: { _identifier: "Level0 Item" },
      1: { _identifier: "Level1 Item" },
      2: { _identifier: "Level2 Item" },
    });

    renderWithTheme(<AppBreadcrumb allTabs={allTabsThreeLevels} />);

    expect(screen.getByTestId("item-level0-tab-1")).toBeInTheDocument();
    expect(screen.getByText("Level0 Item")).toBeInTheDocument();
    expect(screen.getByTestId(`item-level1-${level1TabId}`)).toBeInTheDocument();
    expect(screen.getByText("Level1 Item")).toBeInTheDocument();
    expect(screen.getByTestId(`item-level2-${level2TabId}`)).toBeInTheDocument();
    expect(screen.getByText("Level2 Item")).toBeInTheDocument();
  });

  it("skips levels that have no selectedRecord while rendering levels that do", () => {
    const level1TabId = "tab-level1";
    const level2TabId = "tab-level2";

    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>([
        [0, "tab-1"],
        [1, level1TabId],
        [2, level2TabId],
      ]),
    } as any);

    // level1TabId has NO selectedRecord — only level0 and level2 have records
    mockUseWindowContext.mockReturnValue(
      buildWindowContextValue({
        activeWindow: {
          tabs: {
            "tab-1": { selectedRecord: "record-0" },
            [level2TabId]: { selectedRecord: "record-2" },
          },
          windowIdentifier: "test-window-identifier",
        },
      })
    );

    const allTabsThreeLevels = [
      ...mockTabs,
      [{ id: level1TabId, window: "test-window-id", tabLevel: 1 } as any],
      [{ id: level2TabId, window: "test-window-id", tabLevel: 2 } as any],
    ];

    mockUseCurrentRecordCalls({
      0: { _identifier: "Level0 Item" },
      2: { _identifier: "Level2 Item" },
    });

    renderWithTheme(<AppBreadcrumb allTabs={allTabsThreeLevels} />);

    expect(screen.getByTestId("item-level0-tab-1")).toBeInTheDocument();
    expect(screen.queryByTestId(`item-level1-${level1TabId}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`item-level2-${level2TabId}`)).toBeInTheDocument();
  });

  it("calls clearTabFormState for every active level when window title is clicked with multiple active levels", () => {
    const level1TabId = "tab-level1";
    const level2TabId = "tab-level2";

    mockedUseTableStatePersistenceTab.mockReturnValue({
      setActiveLevel: mockSetActiveLevel,
      activeTabsByLevel: new Map<number, string>([
        [0, "tab-1"],
        [1, level1TabId],
        [2, level2TabId],
      ]),
    } as any);

    mockUseWindowContext.mockReturnValue(
      buildWindowContextValue({
        activeWindow: {
          tabs: {
            "tab-1": { selectedRecord: "record-0" },
            [level1TabId]: { selectedRecord: "record-1" },
            [level2TabId]: { selectedRecord: "record-2" },
          },
          windowIdentifier: "test-window-identifier",
        },
      })
    );

    const allTabsThreeLevels = [
      ...mockTabs,
      [{ id: level1TabId, window: "test-window-id", tabLevel: 1 } as any],
      [{ id: level2TabId, window: "test-window-id", tabLevel: 2 } as any],
    ];

    renderWithTheme(<AppBreadcrumb allTabs={allTabsThreeLevels} />);

    fireEvent.click(screen.getByTestId("item-test-window-id"));

    expect(mockClearTabFormState).toHaveBeenCalledTimes(3);
    expect(mockClearTabFormState).toHaveBeenCalledWith("test-window-identifier", "tab-1");
    expect(mockClearTabFormState).toHaveBeenCalledWith("test-window-identifier", level1TabId);
    expect(mockClearTabFormState).toHaveBeenCalledWith("test-window-identifier", level2TabId);
  });
});
