import { render, screen, fireEvent } from "@testing-library/react";
import DrawerHeader from "./index";

// Mock SVG imports
jest.mock("../../../assets/icons/menu-close.svg", () => {
  return function MenuClose() {
    return <svg data-testid="menu-close-icon" />;
  };
});

jest.mock("../../../assets/icons/menu-open.svg", () => {
  return function MenuOpen() {
    return <svg data-testid="menu-open-icon" />;
  };
});

describe("DrawerHeader", () => {
  const mockOnClick = jest.fn();
  const defaultProps = {
    title: "Test App",
    logo: "https://example.com/logo.png",
    open: true,
    onClick: mockOnClick,
    tabIndex: 0,
  };

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("renders with open state", () => {
    render(<DrawerHeader {...defaultProps} />);

    expect(screen.getByText("Test App")).toBeInTheDocument();
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("renders with closed state", () => {
    render(<DrawerHeader {...defaultProps} open={false} />);

    expect(screen.queryByText("Test App")).not.toBeInTheDocument();
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("calls onClick when button is clicked", () => {
    render(<DrawerHeader {...defaultProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("renders logo when open", () => {
    render(<DrawerHeader {...defaultProps} />);

    const img = screen.getByAltText("Test App Logo");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/logo.png");
  });

  it("applies correct tabIndex to button", () => {
    render(<DrawerHeader {...defaultProps} tabIndex={5} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("tabIndex", "5");
  });
});
