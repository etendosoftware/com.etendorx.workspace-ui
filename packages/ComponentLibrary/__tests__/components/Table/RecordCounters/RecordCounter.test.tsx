import { render, screen } from "@testing-library/react";
import RecordCounter from "../../../../src/components/Table/RecordCounters/RecordCounter";

describe("RecordCounter Component", () => {
  it("should display simple format when totalRecords equals loadedRecords", () => {
    render(<RecordCounter totalRecords={50} loadedRecords={50} />);

    expect(screen.getByTestId("RecordCounter-simple")).toBeInTheDocument();
    expect(screen.getByText("Showing 50 records")).toBeInTheDocument();
  });

  it("should display simple format when totalRecords is greater than loadedRecords", () => {
    render(<RecordCounter totalRecords={100} loadedRecords={25} />);

    expect(screen.getByTestId("RecordCounter-simple")).toBeInTheDocument();
    expect(screen.getByText("Showing 25 records")).toBeInTheDocument();
  });

  it("should display loading skeleton when isLoading is true", () => {
    render(<RecordCounter totalRecords={100} loadedRecords={25} isLoading={true} />);

    expect(screen.getByTestId("RecordCounter-loading")).toBeInTheDocument();
  });

  it("should display fallback message for negative totalRecords", () => {
    render(<RecordCounter totalRecords={-1} loadedRecords={25} />);

    expect(screen.getByTestId("RecordCounter-fallback")).toBeInTheDocument();
    expect(screen.getByText("Records loaded")).toBeInTheDocument();
  });

  it("should display fallback message for negative loadedRecords", () => {
    render(<RecordCounter totalRecords={100} loadedRecords={-1} />);

    expect(screen.getByTestId("RecordCounter-fallback")).toBeInTheDocument();
    expect(screen.getByText("Records loaded")).toBeInTheDocument();
  });

  it("should handle zero records correctly", () => {
    render(<RecordCounter totalRecords={0} loadedRecords={0} />);

    expect(screen.getByTestId("RecordCounter-simple")).toBeInTheDocument();
    expect(screen.getByText("Showing 0 records")).toBeInTheDocument();
  });

  it("should handle large numbers correctly", () => {
    render(<RecordCounter totalRecords={10000} loadedRecords={1000} />);

    expect(screen.getByTestId("RecordCounter-simple")).toBeInTheDocument();
    expect(screen.getByText("Showing 1000 records")).toBeInTheDocument();
  });

  it("should use custom labels when provided", () => {
    const customLabels = {
      showingRecords: "Mostrando {count} elementos",
      showingPartialRecords: "Mostrando {loaded} de {total} elementos",
      recordsLoaded: "Elementos cargados",
    };

    render(<RecordCounter totalRecords={50} loadedRecords={50} labels={customLabels} />);

    expect(screen.getByTestId("RecordCounter-simple")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 50 elementos")).toBeInTheDocument();
  });
});
