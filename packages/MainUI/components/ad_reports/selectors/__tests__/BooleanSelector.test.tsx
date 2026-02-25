import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import BooleanSelector from "../BooleanSelector";

// Mock styles
jest.mock("../styles", () => ({
  useStyle: () => ({
    styles: {
      checkboxContainer: {},
      checkboxLabel: {},
      hiddenCheckbox: {},
      styledCheckbox: {},
      styledCheckboxChecked: {},
      styledCheckboxAfter: {},
      styledCheckboxCheckedAfter: {},
      checkboxBorder: {},
      checkboxBorderHover: {},
      labelText: {},
      disabled: { opacity: 0.5 },
    },
  }),
}));

describe("BooleanSelector", () => {
  const defaultProps = {
    label: "Test Label",
    checked: false,
    onChange: jest.fn(),
    name: "test-boolean",
  };

  it("renders with label", () => {
    render(<BooleanSelector {...defaultProps} />);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("calls onChange when clicked", () => {
    render(<BooleanSelector {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(defaultProps.onChange).toHaveBeenCalledWith("test-boolean", true);
  });

  it("is disabled when readOnly is true", () => {
    render(<BooleanSelector {...defaultProps} readOnly={true} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<BooleanSelector {...defaultProps} disabled={true} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  it("reflects checked state", () => {
    render(<BooleanSelector {...defaultProps} checked={true} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });
});
