import { render, screen, fireEvent } from "@testing-library/react";
import { SubTabsSwitch } from "../SubTabsSwitch";

// Mocks
jest.mock("../TabButton", () => ({
  TabButton: ({ tab, onClick, active }: any) => (
    <button data-testid={`tab-${tab.id}`} onClick={() => onClick(tab)} data-active={active}>
      {tab.name}
    </button>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/components", () => ({
  IconButton: ({ children, "data-testid": testId }: any) => <div data-testid={testId}>{children}</div>,
}));

jest.mock("../../../ComponentLibrary/src/assets/icons/chevron-down.svg", () => {
  return ({ onClick, "data-testid": testId }: any) => (
    <div data-testid={testId} onClick={onClick}>
      Chevron
    </div>
  );
});

describe("SubTabsSwitch", () => {
  const mockTabs = [
    { id: "tab1", name: "Tab 1" },
    { id: "tab2", name: "Tab 2" },
  ];
  const mockCurrent = mockTabs[0];
  const mockOnClick = jest.fn();
  const mockOnDoubleClick = jest.fn();

  it("should render tabs correctly", () => {
    render(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab1"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={false}
        isExpanded={true}
      />
    );

    expect(screen.getByTestId("tab-tab1")).toBeInTheDocument();
    expect(screen.getByTestId("tab-tab2")).toBeInTheDocument();
  });

  it("should mark the active tab", () => {
    render(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab2"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={false}
        isExpanded={true}
      />
    );

    expect(screen.getByTestId("tab-tab1")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("tab-tab2")).toHaveAttribute("data-active", "true");
  });

  it("should call onClick when a tab is clicked", () => {
    render(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab1"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={false}
        isExpanded={true}
      />
    );

    fireEvent.click(screen.getByTestId("tab-tab2"));
    expect(mockOnClick).toHaveBeenCalledWith(mockTabs[1]);
  });

  it("should call handle collapse/expand icons", () => {
    const { rerender } = render(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab1"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={true}
        isExpanded={false}
      />
    );

    const chevron = screen.getByTestId("ChevronDown__tab1");
    fireEvent.click(chevron);
    // When collapsed is true, click calls onClick
    expect(mockOnClick).toHaveBeenCalledWith(mockCurrent);

    rerender(
      <SubTabsSwitch
        tabs={mockTabs}
        current={mockCurrent}
        activeTabId="tab1"
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        collapsed={false}
        isExpanded={true}
      />
    );

    fireEvent.click(chevron);
    // When collapsed is false, click calls onDoubleClick
    expect(mockOnDoubleClick).toHaveBeenCalledWith(mockCurrent);
  });
});
