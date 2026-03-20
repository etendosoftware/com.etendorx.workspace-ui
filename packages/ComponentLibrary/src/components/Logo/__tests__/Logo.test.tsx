import { render, screen } from "@testing-library/react";
import Logo from "../index";

describe("Logo", () => {
  it("renders an img tag when logo is a string", () => {
    render(<Logo logo="https://example.com/logo.png" title="MyApp" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/logo.png");
    expect(img).toHaveAttribute("alt", "MyApp Logo");
  });

  it("renders a div wrapper when logo is a React node", () => {
    const { container } = render(<Logo logo={<svg data-testid="svg-logo" />} />);
    expect(screen.getByTestId("svg-logo")).toBeInTheDocument();
    const wrapper = container.querySelector("div");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders a div when no logo is provided", () => {
    const { container } = render(<Logo />);
    const div = container.querySelector("div");
    expect(div).toBeInTheDocument();
  });

  it("applies size classes to the img element", () => {
    render(<Logo logo="logo.png" title="App" />);
    const img = screen.getByRole("img");
    expect(img.className).toContain("w-9");
    expect(img.className).toContain("h-9");
  });

  it("applies size classes to the wrapper div", () => {
    const { container } = render(<Logo logo={<span>icon</span>} />);
    const div = container.querySelector("div");
    expect(div?.className).toContain("w-9");
    expect(div?.className).toContain("h-9");
  });
});
