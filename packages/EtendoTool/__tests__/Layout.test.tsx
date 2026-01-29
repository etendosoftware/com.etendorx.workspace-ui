import { screen } from "@testing-library/react";
import { render } from "./test-utils";
import { Layout } from "../src/components/Layout";

describe("Layout", () => {
  const defaultProps = {
    activeSection: "configuration" as const,
    onSectionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children content", () => {
    render(
      <Layout {...defaultProps}>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    );
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders sidebar with correct active section", () => {
    render(
      <Layout {...defaultProps} activeSection="installation">
        <div>Content</div>
      </Layout>
    );
    expect(screen.getByText("Installation")).toBeInTheDocument();
  });

  it("passes onSectionChange to sidebar", async () => {
    const onSectionChange = jest.fn();
    const { user } = render(
      <Layout {...defaultProps} onSectionChange={onSectionChange}>
        <div>Content</div>
      </Layout>
    );

    await user.click(screen.getByText("Development"));
    expect(onSectionChange).toHaveBeenCalledWith("development");
  });

  it("toggles sidebar collapse state", async () => {
    const { user } = render(
      <Layout {...defaultProps}>
        <div>Content</div>
      </Layout>
    );

    // Initially expanded - should show full title
    expect(screen.getByText("ETENDO TOOL")).toBeInTheDocument();

    // Click collapse button
    const toggleButtons = screen.getAllByRole("button");
    const collapseButton = toggleButtons.find(btn =>
      btn.querySelector('svg[data-testid="ChevronLeftIcon"]')
    );

    if (collapseButton) {
      await user.click(collapseButton);
      // After collapse - should show abbreviated title
      expect(screen.getByText("ET")).toBeInTheDocument();
    }
  });

  it("has correct layout structure", () => {
    const { container } = render(
      <Layout {...defaultProps}>
        <div>Content</div>
      </Layout>
    );

    expect(container.querySelector(".app-layout")).toBeInTheDocument();
    expect(container.querySelector(".main-content")).toBeInTheDocument();
  });
});
