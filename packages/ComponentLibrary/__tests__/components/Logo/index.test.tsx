import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Logo from "../../../src/components/Logo";

describe("Logo", () => {
  it("should render an image when logo is a string", () => {
    render(<Logo logo="https://example.com/logo.png" title="Test App" />);

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/logo.png");
    expect(img).toHaveAttribute("alt", "Test App Logo");
  });

  it("should render with correct className for image", () => {
    render(<Logo logo="https://example.com/logo.png" />);

    const img = screen.getByRole("img");
    expect(img).toHaveClass("w-9", "h-9");
  });

  it("should render a ReactNode when logo is not a string", () => {
    const CustomLogo = () => <span data-testid="custom-logo">Custom</span>;
    render(<Logo logo={<CustomLogo />} />);

    expect(screen.getByTestId("custom-logo")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should render ReactNode inside a div with correct className", () => {
    const { container } = render(<Logo logo={<span>Logo</span>} />);

    const divElement = container.querySelector("div");
    expect(divElement).toHaveClass("w-9", "h-9");
  });

  it("should render without title prop", () => {
    render(<Logo logo="https://example.com/logo.png" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "undefined Logo");
  });

  it("should render empty div when no logo is provided", () => {
    const { container } = render(<Logo />);

    const divElement = container.querySelector("div");
    expect(divElement).toBeInTheDocument();
    expect(divElement).toHaveClass("w-9", "h-9");
  });

  it("should handle complex ReactNode as logo", () => {
    const ComplexLogo = () => (
      <div>
        <svg data-testid="svg-logo">
          <circle cx="10" cy="10" r="5" />
        </svg>
      </div>
    );

    render(<Logo logo={<ComplexLogo />} title="Complex App" />);

    expect(screen.getByTestId("svg-logo")).toBeInTheDocument();
  });

  it("should apply correct classes to both image and div variants", () => {
    const { rerender, container } = render(<Logo logo="test.png" />);
    let element = screen.getByRole("img");
    expect(element).toHaveClass("w-9", "h-9");

    rerender(<Logo logo={<span>Node</span>} />);
    element = container.querySelector("div") as HTMLElement;
    expect(element).toHaveClass("w-9", "h-9");
  });
});
