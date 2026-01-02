import { render, screen, fireEvent } from "@testing-library/react";
import TextInputBase from "./TextInputBase";
import ThemeProvider from "../../../ThemeProvider";
import "@testing-library/jest-dom";

describe("TextInputBase", () => {
  const defaultProps = {
    value: "",
    setValue: jest.fn(),
    label: "Test Input",
    name: "test-input",
  };

  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
  };

  it("renders correctly with label", () => {
    renderWithTheme(<TextInputBase {...defaultProps} />);
    const input = screen.getByLabelText(/Test Input/i);
    expect(input).toBeInTheDocument();
  });

  it("calls setValue on change", () => {
    renderWithTheme(<TextInputBase {...defaultProps} />);
    const input = screen.getByLabelText(/Test Input/i);
    fireEvent.change(input, { target: { value: "New Value" } });
    expect(defaultProps.setValue).toHaveBeenCalledWith("New Value");
  });

  it("renders disabled state correctly", () => {
    renderWithTheme(<TextInputBase {...defaultProps} disabled />);
    const input = screen.getByLabelText(/Test Input/i);
    expect(input).toBeDisabled();
  });

  it("renders readOnly as disabled state (implementation detail)", () => {
    renderWithTheme(<TextInputBase {...defaultProps} readOnly />);
    const input = screen.getByLabelText(/Test Input/i);
    expect(input).toBeDisabled();
  });

  it("renders left icon and handles click", () => {
    const onLeftClick = jest.fn();
    renderWithTheme(
      <TextInputBase
        {...defaultProps}
        leftIcon={<span data-testid="left-icon">Icon</span>}
        onLeftIconClick={onLeftClick}
      />
    );
    const iconButton = screen.getByLabelText("left icon");
    expect(iconButton).toBeInTheDocument();
    fireEvent.click(iconButton);
    expect(onLeftClick).toHaveBeenCalled();
  });

  it("renders right icon and handles click", () => {
    const onRightClick = jest.fn();
    renderWithTheme(
      <TextInputBase
        {...defaultProps}
        rightIcon={<span data-testid="right-icon">Icon</span>}
        onRightIconClick={onRightClick}
      />
    );
    const iconButton = screen.getByLabelText("right-icon");
    expect(iconButton).toBeInTheDocument();
    fireEvent.click(iconButton);
    expect(onRightClick).toHaveBeenCalled();
  });
});
