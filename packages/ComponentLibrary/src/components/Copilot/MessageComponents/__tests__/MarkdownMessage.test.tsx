import { render, screen } from "@testing-library/react";
import MarkdownMessage from "../MarkdownMessage";

describe("MarkdownMessage", () => {
  it("renders the content", () => {
    render(<MarkdownMessage content="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders empty string without crashing", () => {
    const { container } = render(<MarkdownMessage content="" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders markdown-like text as plain text via mock", () => {
    render(<MarkdownMessage content="# Heading" />);
    expect(screen.getByText("# Heading")).toBeInTheDocument();
  });

  it("renders multiline content", () => {
    render(<MarkdownMessage content={"Line 1\nLine 2"} />);
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });
});
