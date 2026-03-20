import { render, screen, fireEvent } from "@testing-library/react";
import IconButton from "../index";

describe("IconButton", () => {
  it("renders children", () => {
    render(
      <IconButton>
        <span data-testid="icon">★</span>
      </IconButton>
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders as a button element", () => {
    render(<IconButton aria-label="action">icon</IconButton>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<IconButton onClick={handleClick}>icon</IconButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as disabled", () => {
    render(<IconButton disabled>icon</IconButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const handleClick = jest.fn();
    render(
      <IconButton disabled onClick={handleClick}>
        icon
      </IconButton>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders with aria-label", () => {
    render(<IconButton ariaLabel="close">X</IconButton>);
    expect(screen.getByRole("button", { name: "close" })).toBeInTheDocument();
  });

  it("renders iconText when provided", () => {
    render(<IconButton iconText="Save">icon</IconButton>);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<IconButton className="custom-class">icon</IconButton>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-class");
  });

  it("renders with type='button'", () => {
    render(<IconButton>icon</IconButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
