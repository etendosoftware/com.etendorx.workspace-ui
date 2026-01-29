import { screen } from "@testing-library/react";
import { render } from "./test-utils";
import { Sidebar } from "../src/components/Sidebar";

describe("Sidebar", () => {
  const defaultProps = {
    activeSection: "configuration" as const,
    onSectionChange: jest.fn(),
    isCollapsed: false,
    onToggleCollapse: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the sidebar with title", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("ETENDO TOOL")).toBeInTheDocument();
    expect(screen.getByText("Control Center")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Configuration")).toBeInTheDocument();
    expect(screen.getByText("Installation")).toBeInTheDocument();
    expect(screen.getByText("Development")).toBeInTheDocument();
  });

  it("highlights the active section", () => {
    render(<Sidebar {...defaultProps} activeSection="installation" />);
    const installationButton = screen.getByText("Installation").closest("div[role='button']");
    expect(installationButton).toHaveClass("Mui-selected");
  });

  it("calls onSectionChange when clicking a navigation item", async () => {
    const onSectionChange = jest.fn();
    const { user } = render(<Sidebar {...defaultProps} onSectionChange={onSectionChange} />);

    await user.click(screen.getByText("Development"));
    expect(onSectionChange).toHaveBeenCalledWith("development");
  });

  it("shows collapsed view when isCollapsed is true", () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    expect(screen.getByText("ET")).toBeInTheDocument();
    expect(screen.queryByText("ETENDO TOOL")).not.toBeInTheDocument();
  });

  it("calls onToggleCollapse when clicking toggle button", async () => {
    const onToggleCollapse = jest.fn();
    const { user } = render(<Sidebar {...defaultProps} onToggleCollapse={onToggleCollapse} />);

    const toggleButton = screen.getByRole("button", { name: "" });
    await user.click(toggleButton);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("shows footer text when expanded", () => {
    render(<Sidebar {...defaultProps} isCollapsed={false} />);
    expect(screen.getByText("Etendo Development Kit")).toBeInTheDocument();
  });

  it("hides footer text when collapsed", () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    expect(screen.queryByText("Etendo Development Kit")).not.toBeInTheDocument();
  });
});
