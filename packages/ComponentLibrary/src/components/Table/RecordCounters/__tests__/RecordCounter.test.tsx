import { render, screen } from "@testing-library/react";
import RecordCounter from "../RecordCounter";
import SelectionCounter from "../SelectionCounter";

describe("RecordCounter", () => {
  it("renders record count in simple format", () => {
    render(<RecordCounter totalRecords={100} loadedRecords={25} />);
    expect(screen.getByTestId("RecordCounter-simple")).toBeInTheDocument();
    expect(screen.getByText("Showing 25 records")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    render(<RecordCounter totalRecords={100} loadedRecords={0} isLoading />);
    // LoadingSkeleton renders a skeleton element
    const { container } = render(<RecordCounter totalRecords={100} loadedRecords={0} isLoading />);
    expect(container.firstChild).toBeTruthy();
  });

  it("shows fallback for negative totalRecords", () => {
    render(<RecordCounter totalRecords={-1} loadedRecords={0} />);
    expect(screen.getByTestId("RecordCounter-fallback")).toBeInTheDocument();
    expect(screen.getByText("Records loaded")).toBeInTheDocument();
  });

  it("shows fallback for negative loadedRecords", () => {
    render(<RecordCounter totalRecords={100} loadedRecords={-1} />);
    expect(screen.getByTestId("RecordCounter-fallback")).toBeInTheDocument();
  });

  it("uses custom labels", () => {
    render(
      <RecordCounter totalRecords={50} loadedRecords={10} labels={{ showingRecords: "Mostrando {count} registros" }} />
    );
    expect(screen.getByText("Mostrando 10 registros")).toBeInTheDocument();
  });

  it("uses custom fallback label", () => {
    render(<RecordCounter totalRecords={-1} loadedRecords={0} labels={{ recordsLoaded: "Registros cargados" }} />);
    expect(screen.getByText("Registros cargados")).toBeInTheDocument();
  });
});

describe("SelectionCounter", () => {
  it("renders when selectedCount > 0", () => {
    render(<SelectionCounter selectedCount={5} />);
    expect(screen.getByTestId("SelectionCounter")).toBeInTheDocument();
    expect(screen.getByText("5 selected")).toBeInTheDocument();
  });

  it("does not render when selectedCount is 0", () => {
    const { container } = render(<SelectionCounter selectedCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render when selectedCount is negative", () => {
    const { container } = render(<SelectionCounter selectedCount={-1} />);
    expect(container.firstChild).toBeNull();
  });

  it("uses custom selectedLabel", () => {
    render(<SelectionCounter selectedCount={3} selectedLabel="{count} seleccionados" />);
    expect(screen.getByText("3 seleccionados")).toBeInTheDocument();
  });

  it("renders with count of 1", () => {
    render(<SelectionCounter selectedCount={1} />);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });
});
