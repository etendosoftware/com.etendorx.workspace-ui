
import { render, screen } from "@testing-library/react";
import RecordCounterBar from "../../../../src/components/Table/RecordCounters/RecordCounterBar";

describe("RecordCounterBar Component", () => {
  it("should render both RecordCounter and SelectionCounter components", () => {
    render(<RecordCounterBar totalRecords={100} loadedRecords={50} selectedCount={5} />);

    expect(screen.getByTestId("RecordCounterBar")).toBeInTheDocument();
    expect(screen.getByText("Showing 50 records")).toBeInTheDocument();
    expect(screen.getByText("5 selected")).toBeInTheDocument();
  });

  it("should render RecordCounter but not SelectionCounter when no records selected", () => {
    render(<RecordCounterBar totalRecords={100} loadedRecords={50} selectedCount={0} />);

    expect(screen.getByTestId("RecordCounterBar")).toBeInTheDocument();
    expect(screen.getByText("Showing 50 records")).toBeInTheDocument();
    expect(screen.queryByTestId("SelectionCounter")).not.toBeInTheDocument();
  });

  it("should pass loading state to RecordCounter", () => {
    render(<RecordCounterBar totalRecords={100} loadedRecords={50} selectedCount={0} isLoading={true} />);

    expect(screen.getByTestId("RecordCounterBar")).toBeInTheDocument();
    expect(screen.getByTestId("RecordCounter-loading")).toBeInTheDocument();
  });

  it("should handle equal total and loaded records", () => {
    render(<RecordCounterBar totalRecords={50} loadedRecords={50} selectedCount={10} />);

    expect(screen.getByTestId("RecordCounterBar")).toBeInTheDocument();
    expect(screen.getByText("Showing 50 records")).toBeInTheDocument();
    expect(screen.getByText("10 selected")).toBeInTheDocument();
  });

  it("should handle zero records scenario", () => {
    render(<RecordCounterBar totalRecords={0} loadedRecords={0} selectedCount={0} />);

    expect(screen.getByTestId("RecordCounterBar")).toBeInTheDocument();
    expect(screen.getByText("Showing 0 records")).toBeInTheDocument();
    expect(screen.queryByTestId("SelectionCounter")).not.toBeInTheDocument();
  });

  it("should have proper layout structure with Tailwind classes", () => {
    render(<RecordCounterBar totalRecords={100} loadedRecords={50} selectedCount={5} />);

    const container = screen.getByTestId("RecordCounterBar");
    expect(container).toBeInTheDocument();

    // Check that it has the expected Tailwind classes
    expect(container).toHaveClass(
      "flex",
      "justify-start",
      "gap-4",
      "items-center",
      "px-4",
      "py-2",
      "min-h-8",
      "bg-white",
      "border-b",
      "border-gray-200",
      "flex-shrink-0",
      "flex-col",
      "sm:flex-row"
    );
  });

  it("should handle large numbers correctly", () => {
    render(<RecordCounterBar totalRecords={10000} loadedRecords={1000} selectedCount={500} />);

    expect(screen.getByTestId("RecordCounterBar")).toBeInTheDocument();
    expect(screen.getByText("Showing 1000 records")).toBeInTheDocument();
    expect(screen.getByText("500 selected")).toBeInTheDocument();
  });

  it("should use custom labels when provided", () => {
    const customLabels = {
      showingRecords: "Mostrando {count} elementos",
      showingPartialRecords: "Mostrando {loaded} de {total} elementos",
      selectedRecords: "{count} elementos seleccionados",
      recordsLoaded: "Elementos cargados",
    };

    render(<RecordCounterBar totalRecords={100} loadedRecords={50} selectedCount={5} labels={customLabels} />);

    expect(screen.getByTestId("RecordCounterBar")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 50 elementos")).toBeInTheDocument();
    expect(screen.getByText("5 elementos seleccionados")).toBeInTheDocument();
  });
});
