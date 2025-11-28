import { render, screen, fireEvent } from "@testing-library/react";
import AboutButton from "./AboutButton";

describe("AboutButton", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("renders with default props", () => {
    render(<AboutButton onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    render(<AboutButton onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom tooltip", () => {
    render(<AboutButton onClick={mockOnClick} tooltip="Custom Tooltip" />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Custom Tooltip");
  });

  it("respects disabled prop", () => {
    render(<AboutButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<AboutButton onClick={mockOnClick} iconButtonClassName="custom-class" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});
