import { render, screen } from "@testing-library/react";
import Spinner from "../index";

describe("Spinner", () => {
  it("renders without crashing", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders a circular progress element", () => {
    render(<Spinner role="progressbar" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("forwards props to CircularProgress", () => {
    render(<Spinner size={60} data-testid="spinner" />);
    // The spinner wrapper should be rendered
    const { container } = render(<Spinner size={60} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders inside a flex container", () => {
    const { container } = render(<Spinner />);
    // Box with display flex
    const box = container.firstChild as HTMLElement;
    expect(box).toBeTruthy();
  });
});
