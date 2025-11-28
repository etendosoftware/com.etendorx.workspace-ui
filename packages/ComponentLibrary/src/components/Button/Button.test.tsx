import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./Button";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders with filled variant by default", () => {
    render(<Button>Default Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("renders with outlined variant", () => {
    render(<Button variant="outlined">Outlined Button</Button>);

    const button = screen.getByRole("button");
    expect(button.className).toContain("border");
  });

  it("renders with small size by default", () => {
    render(<Button>Small Button</Button>);

    const button = screen.getByRole("button");
    expect(button.className).toContain("h-8");
  });

  it("renders with large size", () => {
    render(<Button size="large">Large Button</Button>);

    const button = screen.getByRole("button");
    expect(button.className).toContain("h-10");
  });

  it("respects disabled prop", () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders with startIcon", () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    render(<Button startIcon={<TestIcon />}>With Icon</Button>);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("With Icon")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom Class</Button>);

    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-class");
  });

  it("applies custom style", () => {
    render(<Button style={{ backgroundColor: "red" }}>Styled Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveStyle({ backgroundColor: "red" });
  });

  it("renders as button type by default", () => {
    render(<Button>Button</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });
});
