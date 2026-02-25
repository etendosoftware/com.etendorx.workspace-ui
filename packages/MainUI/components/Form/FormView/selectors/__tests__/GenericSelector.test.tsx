import { render } from "@testing-library/react";
import { GenericSelector } from "../GenericSelector";
import { useFormContext } from "react-hook-form";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

// Mocks
jest.mock("react-hook-form");
jest.mock("../ProductStockModalSelector", () => ({
  ProductStockModalSelector: () => <div data-testid="ProductStockModalSelector">ProductStockModalSelector</div>,
}));
jest.mock("../SelectSelector", () => ({
  SelectSelector: () => <div data-testid="SelectSelector">SelectSelector</div>,
}));
jest.mock("../StringSelector", () => ({
  StringSelector: () => <div data-testid="StringSelector">StringSelector</div>,
}));
jest.mock("../NumericSelector", () => ({
  NumericSelector: () => <div data-testid="NumericSelector">NumericSelector</div>,
}));
jest.mock("../TableDirSelector", () => ({
  TableDirSelector: () => <div data-testid="TableDirSelector">TableDirSelector</div>,
}));
jest.mock("../DateSelector", () => ({
  DateSelector: () => <div data-testid="DateSelector">DateSelector</div>,
}));
jest.mock("../DatetimeSelector", () => ({
  DatetimeSelector: () => <div data-testid="DatetimeSelector">DatetimeSelector</div>,
}));
jest.mock("../BooleanSelector", () => ({
  BooleanSelector: () => <div data-testid="BooleanSelector">BooleanSelector</div>,
}));
jest.mock("../QuantitySelector", () => ({
  __esModule: true,
  default: () => <div data-testid="QuantitySelector">QuantitySelector</div>,
}));
jest.mock("../TimeSelector", () => ({
  TimeSelector: () => <div data-testid="TimeSelector">TimeSelector</div>,
}));
jest.mock("../ListSelector", () => ({
  ListSelector: () => <div data-testid="ListSelector">ListSelector</div>,
}));
jest.mock("../LocationSelector", () => ({
  __esModule: true,
  default: () => <div data-testid="LocationSelector">LocationSelector</div>,
}));


describe("GenericSelector", () => {
  const getValues = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({
      getValues,
    });
    getValues.mockReturnValue({});
  });

  it("renders ProductStockModalSelector when datasourceName is ProductStockView", () => {
    const field = {
      column: { reference: FIELD_REFERENCE_CODES.SELECT_30 },
      selector: { datasourceName: "ProductStockView" },
    } as any;

    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("ProductStockModalSelector")).toBeInTheDocument();
  });

  it("renders ProductStockModalSelector when reference is FIELD_REFERENCE_CODES.PRODUCT", () => {
    const field = {
      column: { reference: FIELD_REFERENCE_CODES.PRODUCT },
    } as any;

    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("ProductStockModalSelector")).toBeInTheDocument();
  });

  it("renders ProductStockModalSelector when inputName is inpmProductId and reference is SELECT_30", () => {
    const field = {
      inputName: "inpmProductId",
      column: { reference: FIELD_REFERENCE_CODES.SELECT_30 },
    } as any;

    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("ProductStockModalSelector")).toBeInTheDocument();
  });

  it("renders SelectSelector for generic SELECT_30 fields", () => {
    const field = {
      inputName: "genericField",
      column: { reference: FIELD_REFERENCE_CODES.SELECT_30 },
    } as any;

    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("SelectSelector")).toBeInTheDocument();
  });

  it("renders StringSelector as default for unknown references", () => {
    const field = {
      column: { reference: "UNKNOWN" },
    } as any;

    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("StringSelector")).toBeInTheDocument();
  });

  it("handles camelCase fallback for hqlName", () => {
    const field = {
      hqlName: "field_name",
      column: { reference: "UNKNOWN" },
    } as any;

    // Simulate form having data in camelCase version
    getValues.mockReturnValue({ fieldName: "some value" });

    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("StringSelector")).toBeInTheDocument();
  });

  it("renders NumericSelector for numeric fields", () => {
    const field = {
      column: { reference: FIELD_REFERENCE_CODES.NUMERIC },
    } as any;

    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("NumericSelector")).toBeInTheDocument();
  });

  it("renders TableDirSelector for TABLE_DIR_19 fields", () => {
    const field = {
      column: { reference: FIELD_REFERENCE_CODES.TABLE_DIR_19 },
    } as any;

    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("TableDirSelector")).toBeInTheDocument();
  });

  it("renders DateSelector for DATE fields", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.DATE } } as any;
    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("DateSelector")).toBeInTheDocument();
  });

  it("renders BooleanSelector for BOOLEAN fields", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.BOOLEAN } } as any;
    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("BooleanSelector")).toBeInTheDocument();
  });

  it("renders QuantitySelector for QUANTITY fields", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.QUANTITY_29 } } as any;
    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("QuantitySelector")).toBeInTheDocument();
  });

  it("renders TimeSelector for TIME fields", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.TIME }, id: "1" } as any;
    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("TimeSelector")).toBeInTheDocument();
  });

  it("renders ListSelector for LIST fields", () => {
    const field = { column: { reference: FIELD_REFERENCE_CODES.LIST_17 } } as any;
    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("ListSelector")).toBeInTheDocument();
  });
});
