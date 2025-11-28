import { render, screen } from "@testing-library/react";
import Select from "./index";

describe("Select", () => {
  it("renders select element with children", () => {
    render(
      <Select data-testid="test-select">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );

    const select = screen.getByTestId("test-select");
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe("SELECT");
  });

  it("passes props to select element", () => {
    render(
      <Select data-testid="test-select" disabled>
        <option value="1">Option 1</option>
      </Select>
    );

    const select = screen.getByTestId("test-select");
    expect(select).toBeDisabled();
  });

  it("renders children options", () => {
    render(
      <Select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });
});
