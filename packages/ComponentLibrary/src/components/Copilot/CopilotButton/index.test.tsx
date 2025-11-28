import { render, screen, fireEvent } from "@testing-library/react";
import CopilotButton from "./index";

jest.mock("../../../assets/icons/sparks.svg", () => {
  return function SparksIcon() {
    return <svg data-testid="sparks-icon" />;
  };
});

describe("CopilotButton", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("renders with default props", () => {
    render(<CopilotButton onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Open Copilot");
  });

  it("calls onClick when clicked", () => {
    render(<CopilotButton onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom tooltip", () => {
    render(<CopilotButton onClick={mockOnClick} tooltip="Custom Copilot" />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("respects disabled prop", () => {
    render(<CopilotButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<CopilotButton onClick={mockOnClick} className="custom-class" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("renders sparks icon", () => {
    render(<CopilotButton onClick={mockOnClick} />);

    expect(screen.getByTestId("sparks-icon")).toBeInTheDocument();
  });
});
