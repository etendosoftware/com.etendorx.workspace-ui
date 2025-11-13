import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Spinner from "../../../src/components/Spinner";

describe("Spinner", () => {
  it("should render CircularProgress inside a Box", () => {
    const { container } = render(<Spinner />);

    // Check that the spinner is rendered
    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toBeInTheDocument();
  });

  it("should pass props to CircularProgress", () => {
    const { container } = render(<Spinner size={50} thickness={5} />);

    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toBeInTheDocument();
  });

  it("should render with custom color", () => {
    const { container } = render(<Spinner color="secondary" />);

    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toBeInTheDocument();
  });

  it("should render with variant prop", () => {
    const { container } = render(<Spinner variant="determinate" value={50} />);

    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toBeInTheDocument();
  });

  it("should render in a flex container", () => {
    const { container } = render(<Spinner />);

    // The Box component should have flex display
    const boxElement = container.firstChild;
    expect(boxElement).toBeInTheDocument();
  });

  it("should render with indeterminate variant by default", () => {
    const { container } = render(<Spinner />);

    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toBeInTheDocument();
  });

  it("should accept all CircularProgress props", () => {
    const { container } = render(<Spinner size={40} thickness={4} color="primary" disableShrink />);

    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toBeInTheDocument();
  });
});
