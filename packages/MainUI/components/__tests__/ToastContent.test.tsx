import { render } from "@testing-library/react";
import { ToastContent } from "../ToastContent";

describe("ToastContent", () => {
  it("renders null when message is empty", () => {
    const { container } = render(<ToastContent message="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders text replacing newlines when HTML is not detected", () => {
    const { container } = render(<ToastContent message={"Hello\nWorld"} />);
    expect(container.textContent).toBe("Hello\nWorld");
  });

  it("renders text normally and auto-detects HTML", () => {
    const { container } = render(<ToastContent message="<strong>Hello</strong>" />);
    expect(container.innerHTML).toContain("<strong>Hello</strong>");
  });

  it("renders properly with explicit isHtml prop", () => {
    const { container } = render(<ToastContent message="<b>Test html</b><br />newline" isHtml />);
    // Testing library replaces inner <br />
    expect(container.innerHTML).toContain("<b>Test html</b><br>newline");
  });

  it("does not render html tags when not passing html", () => {
    const { getByText } = render(<ToastContent message="Hello World" />);
    expect(getByText("Hello World")).toBeInTheDocument();
  });
});
