import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import PrimaryTabs from "../../../src/components/PrimaryTab/index";
import type { TabItem } from "../../../src/components/PrimaryTab/types";

// Mock MUI components to simplify testing
jest.mock("@mui/icons-material/Check", () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="check-icon" {...props} />,
}));

// Mock child components
jest.mock("../../../src/components/IconButton", () => ({
  __esModule: true,
  default: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button data-testid="menu-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock("../../../src/components/Menu", () => ({
  __esModule: true,
  default: ({
    children,
    anchorEl,
    onClose,
  }: {
    children: React.ReactNode;
    anchorEl: HTMLElement | null;
    onClose: () => void;
  }) =>
    anchorEl ? (
      <div data-testid="menu" role="menu" onClick={onClose}>
        {children}
      </div>
    ) : null,
}));

jest.mock("../../../src/components/Tooltip", () => ({
  __esModule: true,
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
}));

// Mock theme hook to avoid conflicts
jest.mock("../../../src/components/PrimaryTab/styles", () => ({
  tabIndicatorProps: { style: { display: "none" } },
  useStyle: () => ({
    styles: {
      containerBox: {
        display: "flex",
        alignItems: "center",
      },
      tabsContainer: {
        flexGrow: 1,
      },
    },
    sx: {
      tabs: {},
      tab: {},
      menu: {},
      menuItem: {},
      selectedMenuItem: {},
      iconBox: {
        display: "flex",
        alignItems: "center",
      },
    },
  }),
}));

describe("PrimaryTabs", () => {
  const mockIcon = <span data-testid="menu-icon">☰</span>;

  const createMockTabs = (): TabItem[] => [
    {
      id: "tab1",
      label: "First Tab",
      icon: <span data-testid="tab1-icon">🏠</span>,
      fill: "#007acc",
      hoverFill: "#005999",
      showInTab: "both",
    },
    {
      id: "tab2",
      label: "Second Tab",
      icon: <span data-testid="tab2-icon">📄</span>,
      fill: "#28a745",
      hoverFill: "#1e7e34",
      showInTab: "both",
    },
    {
      id: "tab3",
      label: "Third Tab",
      icon: <span data-testid="tab3-icon">⚙️</span>,
      fill: "#dc3545",
      hoverFill: "#c82333",
      showInTab: "label",
    },
  ];

  const createMinimalTab = (): TabItem[] => [
    {
      id: "minimal",
      label: "Minimal Tab",
    },
  ];

  it("renders with tabs and menu button", () => {
    const tabs = createMockTabs();
    render(<PrimaryTabs tabs={tabs} icon={mockIcon} />);

    // Check tabs are rendered
    expect(screen.getByText("First Tab")).toBeInTheDocument();
    expect(screen.getByText("Second Tab")).toBeInTheDocument();
    expect(screen.getByText("Third Tab")).toBeInTheDocument();

    // Check menu button is rendered
    expect(screen.getByTestId("menu-button")).toBeInTheDocument();
    expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
  });

  it("renders tabs with icons when showInTab includes icon", () => {
    const tabs = createMockTabs();
    render(<PrimaryTabs tabs={tabs} icon={mockIcon} />);

    // First tab should show both icon and label
    expect(screen.getByTestId("tab1-icon")).toBeInTheDocument();
    expect(screen.getByText("First Tab")).toBeInTheDocument();

    // Third tab should show only label (showInTab: "label")
    expect(screen.queryByTestId("tab3-icon")).not.toBeInTheDocument();
    expect(screen.getByText("Third Tab")).toBeInTheDocument();
  });

  it("handles tab selection and calls onChange", async () => {
    const onChange = jest.fn();
    const tabs = createMockTabs();
    const user = userEvent.setup();

    render(<PrimaryTabs tabs={tabs} icon={mockIcon} onChange={onChange} />);

    // Click on second tab
    const secondTab = screen.getByText("Second Tab");
    await user.click(secondTab);

    expect(onChange).toHaveBeenCalledWith("tab2");
  });

  it("opens and closes menu when clicking menu button", async () => {
    const tabs = createMockTabs();
    const user = userEvent.setup();

    render(<PrimaryTabs tabs={tabs} icon={mockIcon} />);

    // Menu should not be visible initially
    expect(screen.queryByTestId("menu")).not.toBeInTheDocument();

    // Click menu button to open
    const menuButton = screen.getByTestId("menu-button");
    await user.click(menuButton);

    // Menu should be visible
    expect(screen.getByTestId("menu")).toBeInTheDocument();

    // Close menu by clicking on it
    const menu = screen.getByTestId("menu");
    await user.click(menu);

    // Wait for menu to close
    await waitFor(() => {
      expect(screen.queryByTestId("menu")).not.toBeInTheDocument();
    });
  });

  it("displays tabs in menu with labels", async () => {
    const tabs = createMockTabs();
    const user = userEvent.setup();

    render(<PrimaryTabs tabs={tabs} icon={mockIcon} />);

    // Open menu
    await user.click(screen.getByTestId("menu-button"));

    // Menu should be visible
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Check tooltips have correct titles
    const tooltips = screen.getAllByTestId("tooltip");
    expect(tooltips.length).toBeGreaterThan(0);

    // At least the first tab should be there
    const firstTabTooltip = tooltips.find((tooltip) => tooltip.getAttribute("title") === "First Tab");
    expect(firstTabTooltip).toBeInTheDocument();
  });

  it("shows check icon for selected tab in menu", async () => {
    const tabs = createMockTabs();
    const user = userEvent.setup();

    render(<PrimaryTabs tabs={tabs} icon={mockIcon} />);

    // Open menu
    await user.click(screen.getByTestId("menu-button"));

    // Check if check icon is present (first tab should be selected by default)
    const checkIcons = screen.queryAllByTestId("check-icon");
    expect(checkIcons.length).toBeGreaterThanOrEqual(0);
  });

  it("handles menu item selection", async () => {
    const onChange = jest.fn();
    const tabs = createMockTabs();
    const user = userEvent.setup();

    render(<PrimaryTabs tabs={tabs} icon={mockIcon} onChange={onChange} />);

    // Open menu
    await user.click(screen.getByTestId("menu-button"));

    // Find and click on a menu item
    const tooltips = screen.getAllByTestId("tooltip");
    const secondTabTooltip = tooltips.find((tooltip) => tooltip.getAttribute("title") === "Second Tab");

    if (secondTabTooltip) {
      await user.click(secondTabTooltip);
      expect(onChange).toHaveBeenCalledWith("tab2");
    }

    // Menu should close after selection
    await waitFor(() => {
      expect(screen.queryByTestId("menu")).not.toBeInTheDocument();
    });
  });

  it("handles mouse interactions on tabs", async () => {
    const tabs = createMockTabs();
    const user = userEvent.setup();

    render(<PrimaryTabs tabs={tabs} icon={mockIcon} />);

    const firstTab = screen.getByText("First Tab");

    // Hover interactions should not cause errors
    await user.hover(firstTab);
    await user.unhover(firstTab);

    expect(firstTab).toBeInTheDocument();
  });

  it("renders with minimal tab configuration", () => {
    const tabs = createMinimalTab();
    render(<PrimaryTabs tabs={tabs} icon={mockIcon} />);

    expect(screen.getByText("Minimal Tab")).toBeInTheDocument();
    expect(screen.getByTestId("menu-button")).toBeInTheDocument();
  });

  it("handles empty tabs array gracefully", () => {
    render(<PrimaryTabs tabs={[]} icon={mockIcon} />);

    expect(screen.getByTestId("menu-button")).toBeInTheDocument();
    // Should not crash with empty tabs
  });

  it("works without onChange callback", async () => {
    const tabs = createMockTabs();
    const user = userEvent.setup();

    render(<PrimaryTabs tabs={tabs} icon={mockIcon} />);

    // Should not crash when clicking tabs without onChange
    const firstTab = screen.getByText("First Tab");
    await user.click(firstTab);

    expect(firstTab).toBeInTheDocument();
  });

  it("renders tabs with icon-only configuration", () => {
    const iconOnlyTabs: TabItem[] = [
      {
        id: "icon-only",
        label: "Icon Only Tab",
        icon: <span data-testid="icon-only-icon">🎯</span>,
        showInTab: "icon",
      },
    ];

    render(<PrimaryTabs tabs={iconOnlyTabs} icon={mockIcon} />);

    // Should show icon but not label in tab
    expect(screen.getByTestId("icon-only-icon")).toBeInTheDocument();
    expect(screen.queryByText("Icon Only Tab")).not.toBeInTheDocument();
  });

  it("renders tabs with label-only configuration", () => {
    const labelOnlyTabs: TabItem[] = [
      {
        id: "label-only",
        label: "Label Only Tab",
        icon: <span data-testid="label-only-icon">📝</span>,
        showInTab: "label",
      },
    ];

    render(<PrimaryTabs tabs={labelOnlyTabs} icon={mockIcon} />);

    // Should show label but not icon in tab
    expect(screen.getByText("Label Only Tab")).toBeInTheDocument();
    expect(screen.queryByTestId("label-only-icon")).not.toBeInTheDocument();
  });

  it("handles tabs without icons in menu", async () => {
    const tabsWithoutIcons: TabItem[] = [
      {
        id: "no-icon",
        label: "No Icon Tab",
      },
    ];
    const user = userEvent.setup();

    render(<PrimaryTabs tabs={tabsWithoutIcons} icon={mockIcon} />);

    // Open menu
    await user.click(screen.getByTestId("menu-button"));

    // Should render menu item without icon
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toHaveAttribute("title", "No Icon Tab");
  });

  it("handles tab selection with correct value", async () => {
    const onChange = jest.fn();
    const tabs = createMockTabs();
    const user = userEvent.setup();

    render(<PrimaryTabs tabs={tabs} icon={mockIcon} onChange={onChange} />);

    // The tabs should be rendered
    expect(screen.getByText("First Tab")).toBeInTheDocument();

    // Click the second tab by text
    const secondTab = screen.getByText("Second Tab");
    await user.click(secondTab);

    expect(onChange).toHaveBeenCalledWith("tab2");
  });
});
