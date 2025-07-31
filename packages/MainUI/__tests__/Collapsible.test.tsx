import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Collapsible } from "../components/Form/Collapsible";

const mockProps = {
  title: "Test Section",
  children: <div>Test content</div>,
  isExpanded: false,
  sectionId: "test-section",
};

describe("Collapsible", () => {
  it("renders with title and children", () => {
    render(<Collapsible {...mockProps} />);

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("shows correct aria attributes when collapsed", () => {
    render(<Collapsible {...mockProps} />);

    const button = screen.getByRole("button");
    const content = screen.getByText("Test content").closest('[id="section-content-test-section"]');

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(content).toHaveAttribute("aria-hidden", "true");
  });

  it("shows correct aria attributes when expanded", () => {
    render(<Collapsible {...mockProps} isExpanded />);

    const button = screen.getByRole("button");
    const content = screen.getByText("Test content").closest('[id="section-content-test-section"]');

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(content).toHaveAttribute("aria-hidden", "false");
  });

  it("calls onToggle when clicked", () => {
    const onToggle = jest.fn();
    render(<Collapsible {...mockProps} onToggle={onToggle} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("calls onToggle when Enter key is pressed", () => {
    const onToggle = jest.fn();
    render(<Collapsible {...mockProps} onToggle={onToggle} />);

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "Enter" });

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("calls onToggle when Space key is pressed", () => {
    const onToggle = jest.fn();
    render(<Collapsible {...mockProps} onToggle={onToggle} />);

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: " " });

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("does not call onToggle for other keys", () => {
    const onToggle = jest.fn();
    render(<Collapsible {...mockProps} onToggle={onToggle} />);

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "Tab" });

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("renders with custom icon", () => {
    const customIcon = <span data-testid="custom-icon">Custom Icon</span>;
    render(<Collapsible {...mockProps} icon={customIcon} />);

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders with default icon when no icon provided", () => {
    render(<Collapsible {...mockProps} icon={undefined} />);

    const iconButtons = screen.getAllByTestId("icon-button");
    expect(iconButtons[0]).toBeInTheDocument();
    expect(iconButtons[0]).toContainElement(screen.getAllByTestId("mock-svg")[0]);
  });

  it("shows chevron down when collapsed", () => {
    render(<Collapsible {...mockProps} isExpanded={false} />);

    const iconButtons = screen.getAllByTestId("icon-button");
    expect(iconButtons[1]).toContainElement(screen.getAllByTestId("mock-svg")[1]);
  });

  it("shows chevron up when expanded", () => {
    render(<Collapsible {...mockProps} isExpanded />);

    const iconButtons = screen.getAllByTestId("icon-button");
    expect(iconButtons[1]).toContainElement(screen.getAllByTestId("mock-svg")[1]);
  });

  it("applies correct CSS classes when collapsed", () => {
    const { container } = render(<Collapsible {...mockProps} isExpanded={false} />);

    const sectionContainer = container.querySelector('[id="section-test-section"]');
    expect(sectionContainer).toHaveClass("overflow-hidden");
  });

  it("applies correct CSS classes when expanded", () => {
    const { container } = render(<Collapsible {...mockProps} isExpanded />);

    const sectionContainer = container.querySelector('[id="section-test-section"]');
    expect(sectionContainer).toHaveClass("overflow-visible");
  });

  it("sets correct id attributes", () => {
    const { container } = render(<Collapsible {...mockProps} />);

    const section = container.querySelector('[id="section-test-section"]');
    const content = container.querySelector('[id="section-content-test-section"]');

    expect(section).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });

  it("handles missing sectionId gracefully", () => {
    const propsWithoutSectionId = { ...mockProps, sectionId: undefined };
    render(<Collapsible {...propsWithoutSectionId} />);

    const section = screen.getByRole("button").closest('[id="section-"]');
    const content = screen.getByText("Test content").closest('[id="section-content-"]');

    expect(section).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });

  it("works without onToggle callback", () => {
    render(<Collapsible {...mockProps} onToggle={undefined} />);

    const button = screen.getByRole("button");
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it("manages tabindex correctly for focusable elements when collapsed", async () => {
    const childrenWithFocusableElements = (
      <div>
        <button type="button">Focusable Button</button>
        <input type="text" data-testid="test-input" />
        <a href="#test">Link</a>
      </div>
    );

    render(
      <Collapsible {...mockProps} isExpanded={false}>
        {childrenWithFocusableElements}
      </Collapsible>
    );

    await waitFor(() => {
      const button = screen.getByText("Focusable Button");
      const input = screen.getByTestId("test-input");
      const link = screen.getByText("Link");

      expect(button).toHaveAttribute("tabindex", "-1");
      expect(input).toHaveAttribute("tabindex", "-1");
      expect(link).toHaveAttribute("tabindex", "-1");
    });
  });

  it("manages tabindex correctly for focusable elements when expanded", async () => {
    const childrenWithFocusableElements = (
      <div>
        <button type="button">Focusable Button</button>
        <input type="text" data-testid="test-input-expanded" />
        <a href="#test">Link</a>
      </div>
    );

    render(
      <Collapsible {...mockProps} isExpanded>
        {childrenWithFocusableElements}
      </Collapsible>
    );

    await waitFor(() => {
      const button = screen.getByText("Focusable Button");
      const input = screen.getByTestId("test-input-expanded");
      const link = screen.getByText("Link");

      expect(button).not.toHaveAttribute("tabindex", "-1");
      expect(input).not.toHaveAttribute("tabindex", "-1");
      expect(link).not.toHaveAttribute("tabindex", "-1");
    });
  });

  it("wraps non-div children in div", () => {
    const textContent = "Just text content";
    const { container } = render(<Collapsible {...mockProps}>{textContent}</Collapsible>);

    const contentWrapper = container.querySelector(".px-3.pb-12 > div");
    expect(contentWrapper).toBeInTheDocument();
    expect(contentWrapper).toHaveTextContent(textContent);
  });

  it("does not double-wrap div children", () => {
    const divContent = <div>Div content</div>;
    const { container } = render(<Collapsible {...mockProps}>{divContent}</Collapsible>);

    const contentWrapper = container.querySelector(".px-3.pb-12");
    expect(contentWrapper?.children).toHaveLength(1);
    expect(contentWrapper?.firstChild).toHaveTextContent("Div content");
  });

  it("handles overflow visibility transition", async () => {
    const { rerender } = render(<Collapsible {...mockProps} isExpanded={false} />);

    rerender(<Collapsible {...mockProps} isExpanded />);

    const contentDiv = screen.getByText("Test content").closest('[id="section-content-test-section"]');
    expect(contentDiv).toHaveClass("overflow-hidden");

    await waitFor(
      () => {
        expect(contentDiv).toHaveClass("overflow-visible");
      },
      { timeout: 400 }
    );
  });
});
