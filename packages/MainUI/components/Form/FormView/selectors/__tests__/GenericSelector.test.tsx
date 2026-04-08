import { render } from "@testing-library/react";
import { GenericSelector } from "../GenericSelector";
import { useFormContext } from "react-hook-form";
import { FIELD_REFERENCE_CODES, PRODUCT_STOCK_VIEW_REFERENCE_IDS } from "@/utils/form/constants";

// Mock Next.js server dependencies
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

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

jest.mock("../SelectorModal", () => ({
  __esModule: true,
  default: () => <div data-testid="SelectorModal">SelectorModal</div>,
}));

jest.mock("@/components/ProcessModal/ProcessDefinitionModal", () => ({
  __esModule: true,
  default: () => <div data-testid="ProcessDefinitionModal">ProcessDefinitionModal</div>,
}));

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    client: {
      post: jest.fn(async () => ({ ok: true, data: { name: "Test Process", id: "proc-1" } })),
    },
  },
}));

jest.mock("@/utils/form/selectors/utils", () => ({
  getSelectorFieldName: jest.fn((field) => field.hqlName || field.name),
  updateSelectorValue: jest.fn(),
}));

describe("GenericSelector", () => {
  const getValues = jest.fn();
  const setValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({
      getValues,
      setValue,
    });
    getValues.mockReturnValue({});
  });

  it("handles camelCase fallback for hqlName", () => {
    const field = { hqlName: "field_name", column: { reference: "UNKNOWN" } } as any;
    getValues.mockReturnValue({ fieldName: "some value" });
    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("StringSelector")).toBeInTheDocument();
  });

  const cases = [
    {
      title: "datasourceName is ProductStockView",
      expected: "ProductStockModalSelector",
      field: { column: { reference: "30" }, selector: { datasourceName: "ProductStockView" } },
    },
    {
      title: "referenceSearchKey is a ProductStockView reference",
      expected: "ProductStockModalSelector",
      field: { column: { reference: "30", referenceSearchKey: PRODUCT_STOCK_VIEW_REFERENCE_IDS[0] } },
    },
    {
      title: "inputName is inpmProductId (renders as dropdown like Classic)",
      expected: "SelectSelector",
      field: { inputName: "inpmProductId", column: { reference: "30" } },
    },
    {
      title: "generic SELECT_30 fields",
      expected: "SelectSelector",
      field: { inputName: "genericField", column: { reference: FIELD_REFERENCE_CODES.SELECT_30.id } },
    },
    { title: "unknown references", expected: "StringSelector", field: { column: { reference: "UNKNOWN" } } },
    {
      title: "numeric fields",
      expected: "NumericSelector",
      field: { column: { reference: FIELD_REFERENCE_CODES.NUMERIC.id } },
    },
    {
      title: "TABLE_DIR_19 fields",
      expected: "TableDirSelector",
      field: { column: { reference: FIELD_REFERENCE_CODES.TABLE_DIR_19.id } },
    },
    { title: "DATE fields", expected: "DateSelector", field: { column: { reference: FIELD_REFERENCE_CODES.DATE.id } } },
    {
      title: "BOOLEAN fields",
      expected: "BooleanSelector",
      field: { column: { reference: FIELD_REFERENCE_CODES.BOOLEAN.id } },
    },
    {
      title: "QUANTITY_29 fields",
      expected: "QuantitySelector",
      field: { column: { reference: FIELD_REFERENCE_CODES.QUANTITY_29.id } },
    },
    {
      title: "TIME fields",
      expected: "TimeSelector",
      field: { column: { reference: FIELD_REFERENCE_CODES.TIME.id }, id: "1" },
    },
    {
      title: "LIST_17 fields",
      expected: "ListSelector",
      field: { column: { reference: FIELD_REFERENCE_CODES.LIST_17.id } },
    },
  ];

  test.each(cases)("renders $expected when $title", ({ expected, field }: any) => {
    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId(expected)).toBeInTheDocument();
  });

  it("renders selector component with flex wrapper", () => {
    const field = { column: { reference: "10" }, id: "field-1" } as any;
    const { container } = render(<GenericSelector field={field} isReadOnly={false} />);

    // Component should render without errors
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles field with tableRelated selector property", () => {
    const field = {
      id: "field-1",
      column: { reference: "30" },
      selector: { hasTableRelated: true, datasourceName: "TestEntity" },
    } as any;

    // Should render without throwing error
    const { container } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles field with processDefinitionRelated selector property", () => {
    const field = {
      id: "field-1",
      name: "TestField",
      column: { reference: "30" },
      selector: {
        hasProcessDefinitionRelated: true,
        processDefinitionId: "proc-1",
        datasourceName: "TestEntity",
      },
    } as any;

    // Should render without throwing error
    const { container } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("uses camelCase hqlName when main hqlName is not in formData", () => {
    const field = {
      hqlName: "field_name",
      column: { reference: "UNKNOWN" },
    } as any;

    getValues.mockReturnValue({ fieldName: "some value" });

    const { getByTestId } = render(<GenericSelector field={field} isReadOnly={false} />);
    expect(getByTestId("StringSelector")).toBeInTheDocument();
  });
});
