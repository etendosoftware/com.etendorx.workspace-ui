import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AppBreadcrumb from "../Breadcrums";
import { renderWithTheme } from "../../test-utils/test-theme-provider";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/window/test-window"),
}));

// Mock hooks
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
const mockGetTabFormState = jest.fn();

jest.mock("@/contexts/window", () => ({
  useWindowContext: () => ({
    activeWindow: { tabs: {} },
    getTabFormState: mockGetTabFormState,
    clearTabFormState: mockClearTabFormState,
    setAllWindowsInactive: mockSetAllWindowsInactive,
  }),
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({
    graph: {
      clear: jest.fn(),
      clearSelected: jest.fn(),
    },
  }),
}));

jest.mock("@/hooks/useCurrentRecord", () => ({
  useCurrentRecord: () => ({
    record: { _identifier: "Record 1" },
  }),
}));

jest.mock("@/contexts/favorites", () => ({
  useFavoritesContext: () => ({
    isFavorite: jest.fn(() => false),
    toggle: jest.fn(),
    menuIdByWindowId: new Map(),
  }),
}));

// Mock Component Library Breadcrumb
jest.mock("@workspaceui/componentlibrary/src/components/Breadcrums", () => ({
  __esModule: true,
  default: ({ items, onHomeClick }: any) => (
    <div data-testid="breadcrumb-lib">
      <button onClick={onHomeClick} data-testid="home-button">
        Home
      </button>
      {items.map((item: any) => (
        <span key={item.id} onClick={item.onClick} data-testid={`item-${item.id}`}>
          {item.label}
        </span>
      ))}
    </div>
  ),
}));

describe("AppBreadcrumb", () => {
  const mockTabs = [
    [
      {
        id: "tab-1",
        window: "test-window-id",
        window$_identifier: "test-window-id",
      } as any,
    ],
  ];

  it("renders breadcrumb items correctly", () => {
    import("next/navigation").then(({ usePathname }: any) => {
      usePathname.mockReturnValue("/window/test-window-id");
    });

    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    expect(screen.getByText("test-window-id")).toBeInTheDocument();
  });

  it("renders new record breadcrumb when on NewRecord path", () => {
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/window/test-window-id/NewRecord");

    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    expect(screen.getByText("breadcrumb.newRecord")).toBeInTheDocument();
  });

  it("calls setAllWindowsInactive when home is clicked", () => {
    renderWithTheme(<AppBreadcrumb allTabs={mockTabs} />);

    const homeButton = screen.getByTestId("home-button");
    fireEvent.click(homeButton);

    expect(mockSetAllWindowsInactive).toHaveBeenCalled();
  });
});
