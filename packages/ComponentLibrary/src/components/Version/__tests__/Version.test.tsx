import { render, screen } from "@testing-library/react";
import Version from "../index";

describe("Version", () => {
  it("renders the version title", () => {
    render(<Version title="v1.2.3" />);
    expect(screen.getByText("v1.2.3")).toBeInTheDocument();
  });

  it("renders inside a footer element", () => {
    const { container } = render(<Version title="v1.0.0" />);
    const footer = container.querySelector("footer");
    expect(footer).toBeTruthy();
  });

  it("returns null when title is not provided", () => {
    const { container } = render(<Version title="" />);
    expect(container.firstChild).toBeNull();
  });

  it("applies custom className to span", () => {
    render(<Version title="v2.0.0" customClassNameSpan="my-custom-class" />);
    const span = screen.getByText("v2.0.0");
    expect(span.className).toContain("my-custom-class");
  });

  it("renders span with default styling classes", () => {
    render(<Version title="v1.0.0" />);
    const span = screen.getByText("v1.0.0");
    expect(span.tagName.toLowerCase()).toBe("span");
  });
});
