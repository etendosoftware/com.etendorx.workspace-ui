import { render, screen, fireEvent } from "@testing-library/react";
import RadioButtonItem from "./index";

describe("RadioButtonItem", () => {
  const mockOnSelect = jest.fn();
  const baseProps = {
    id: 1,
    title: "Test Title",
    description: "Test Description",
    isSelected: false,
    onSelect: mockOnSelect,
  };

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it("renders title and description", () => {
    render(<RadioButtonItem {...baseProps} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    render(<RadioButtonItem {...baseProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnSelect).toHaveBeenCalledWith(1);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it("applies selected styles when isSelected is true", () => {
    render(<RadioButtonItem {...baseProps} isSelected={true} />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-opacity-5");
  });

  it("applies unselected styles when isSelected is false", () => {
    render(<RadioButtonItem {...baseProps} isSelected={false} />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-transparent");
  });

  it("renders radio indicator when selected", () => {
    const { container } = render(<RadioButtonItem {...baseProps} isSelected={true} />);

    // The inner circle (indicator) should be present when selected
    const innerCircle = container.querySelector(".w-3.h-3.rounded-full");
    expect(innerCircle).toBeInTheDocument();
  });

  it("does not render radio indicator when not selected", () => {
    const { container } = render(<RadioButtonItem {...baseProps} isSelected={false} />);

    // The inner circle should not be present when not selected
    const innerCircle = container.querySelector(".w-3.h-3.rounded-full");
    expect(innerCircle).not.toBeInTheDocument();
  });
});
