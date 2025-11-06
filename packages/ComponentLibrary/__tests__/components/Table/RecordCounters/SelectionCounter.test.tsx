
import { render, screen } from "@testing-library/react";
import SelectionCounter from "../../../../src/components/Table/RecordCounters/SelectionCounter";

describe("SelectionCounter Component", () => {
  it("should not render when selectedCount is 0", () => {
    const { container } = render(<SelectionCounter selectedCount={0} />);

    expect(container.firstChild).toBeNull();
  });

  it("should not render when selectedCount is negative", () => {
    const { container } = render(<SelectionCounter selectedCount={-1} />);

    expect(container.firstChild).toBeNull();
  });

  it("should display selection count when selectedCount is 1", () => {
    render(<SelectionCounter selectedCount={1} />);

    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("should display selection count when selectedCount is greater than 1", () => {
    render(<SelectionCounter selectedCount={5} />);

    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
    expect(screen.getByText("5 selected")).toBeInTheDocument();
  });

  it("should handle large selection counts", () => {
    render(<SelectionCounter selectedCount={1000} />);

    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
    expect(screen.getByText("1000 selected")).toBeInTheDocument();
  });

  it("should have correct Tailwind classes", () => {
    render(<SelectionCounter selectedCount={3} />);

    const element = screen.getByTestId("SelectionCounter");
    expect(element).toBeInTheDocument();

    // Check that the element has the correct Tailwind classes
    expect(element).toHaveClass("text-sm", "font-semibold");
  });

  it("should use custom label when provided", () => {
    render(<SelectionCounter selectedCount={3} selectedLabel="{count} elementos seleccionados" />);

    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
    expect(screen.getByText("3 elementos seleccionados")).toBeInTheDocument();
  });
});
