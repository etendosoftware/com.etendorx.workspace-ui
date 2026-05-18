import { render, screen } from "@testing-library/react";
import RecordCounterBar from "../RecordCounterBar";
import LoadingSkeleton from "../LoadingSkeleton";

describe("RecordCounterBar", () => {
  it("renders the bar container", () => {
    render(<RecordCounterBar totalRecords={100} loadedRecords={25} selectedCount={0} />);
    expect(screen.getByTestId("RecordCounterBar")).toBeInTheDocument();
  });

  it("renders record count", () => {
    render(<RecordCounterBar totalRecords={100} loadedRecords={50} selectedCount={0} />);
    expect(screen.getByTestId("RecordCounter-simple")).toBeInTheDocument();
  });

  it("renders selection counter when records are selected", () => {
    render(<RecordCounterBar totalRecords={100} loadedRecords={50} selectedCount={3} />);
    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
  });

  it("does not render selection counter when none selected", () => {
    render(<RecordCounterBar totalRecords={100} loadedRecords={50} selectedCount={0} />);
    expect(screen.queryByTestId("SelectionCounter")).not.toBeInTheDocument();
  });

  it("forwards labels to counters", () => {
    render(
      <RecordCounterBar
        totalRecords={100}
        loadedRecords={10}
        selectedCount={2}
        labels={{ showingRecords: "{count} items loaded", selectedRecords: "{count} chosen" }}
      />
    );
    expect(screen.getByText("10 items loaded")).toBeInTheDocument();
    expect(screen.getByText("2 chosen")).toBeInTheDocument();
  });
});

describe("LoadingSkeleton", () => {
  it("renders with numeric width and height", () => {
    const { container } = render(<LoadingSkeleton width={200} height={30} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("200px");
    expect(el.style.height).toBe("30px");
  });

  it("renders with string width and height", () => {
    const { container } = render(<LoadingSkeleton width="100%" height="2rem" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("100%");
    expect(el.style.height).toBe("2rem");
  });

  it("renders with data-testid", () => {
    render(<LoadingSkeleton data-testid="my-skeleton" />);
    expect(screen.getByTestId("my-skeleton")).toBeInTheDocument();
  });

  it("applies animate-pulse class", () => {
    const { container } = render(<LoadingSkeleton />);
    expect((container.firstChild as HTMLElement).className).toContain("animate-pulse");
  });

  it("renders with default dimensions when none provided", () => {
    const { container } = render(<LoadingSkeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("120px");
    expect(el.style.height).toBe("20px");
  });
});
