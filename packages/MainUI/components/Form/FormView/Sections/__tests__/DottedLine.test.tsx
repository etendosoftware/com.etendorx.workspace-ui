import { render, screen } from "@testing-library/react";
import DottedLine from "../DottedLine";

describe("DottedLine", () => {
  it("renders the dotted line when shouldRenderDottedLine is true", () => {
    // fields has 5 items, interval is 2, index is 0: (0+1)%2 !== 0 → true, 0 < 5 → renders
    render(<DottedLine fields={[1, 2, 3, 4, 5]} dottedLineInterval={2} index={0} />);
    expect(screen.getByTestId("Box__575ca2")).toBeInTheDocument();
  });

  it("returns null when index is at interval boundary", () => {
    // index=1, (1+1)%2 === 0 → should not render
    const { container } = render(<DottedLine fields={[1, 2, 3]} dottedLineInterval={2} index={1} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when index is at or beyond fields length", () => {
    // index=5, fields.length=5: 5 < 5 is false → should not render
    const { container } = render(<DottedLine fields={[1, 2, 3, 4, 5]} dottedLineInterval={3} index={5} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when index is within bounds and not at interval", () => {
    // fields has 3 items, interval 3, index 0: (0+1)%3 !== 0 → renders
    render(<DottedLine fields={[1, 2, 3]} dottedLineInterval={3} index={0} />);
    expect(screen.getByTestId("Box__575ca2")).toBeInTheDocument();
  });
});
