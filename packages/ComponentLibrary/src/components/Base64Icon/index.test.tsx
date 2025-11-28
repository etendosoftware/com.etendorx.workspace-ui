import { render, screen } from "@testing-library/react";
import Base64Icon from "./index";

describe("Base64Icon", () => {
  const testSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg";

  it("renders with required props", () => {
    render(<Base64Icon src={testSrc} />);

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", testSrc);
  });

  it("uses default alt text when not provided", () => {
    render(<Base64Icon src={testSrc} />);

    const img = screen.getByAltText("Icon");
    expect(img).toBeInTheDocument();
  });

  it("applies custom alt text", () => {
    render(<Base64Icon src={testSrc} alt="Custom Icon" />);

    const img = screen.getByAltText("Custom Icon");
    expect(img).toBeInTheDocument();
  });

  it("applies default size when not provided", () => {
    render(<Base64Icon src={testSrc} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "16");
    expect(img).toHaveAttribute("height", "16");
  });

  it("applies custom size", () => {
    render(<Base64Icon src={testSrc} size={32} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "32");
    expect(img).toHaveAttribute("height", "32");
  });

  it("applies custom className", () => {
    render(<Base64Icon src={testSrc} className="custom-icon" />);

    const img = screen.getByRole("img");
    expect(img.className).toContain("custom-icon");
    expect(img.className).toContain("icon-base64");
  });

  it("applies base CSS class", () => {
    render(<Base64Icon src={testSrc} />);

    const img = screen.getByRole("img");
    expect(img.className).toContain("icon-base64");
  });
});
