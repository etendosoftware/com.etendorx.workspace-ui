import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { ProcessParameterSelector } from "../ProcessParameterSelector";

// Mock hooks and components
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ session: {} }),
}));

jest.mock("@/components/Form/FormView/selectors/PasswordSelector", () => ({
  PasswordSelector: ({ field }: any) => <input data-testid="password-selector" name={field.hqlName} type="password" />,
}));

jest.mock("@/components/Form/FormView/selectors/BooleanSelector", () => ({
  BooleanSelector: ({ field }: any) => <input data-testid="boolean-selector" name={field.hqlName} type="checkbox" />,
}));

jest.mock("@/components/Form/FormView/selectors/NumericSelector", () => ({
  NumericSelector: ({ field }: any) => <input data-testid="numeric-selector" name={field.hqlName} type="number" />,
}));

jest.mock("@/components/Form/FormView/selectors/DateSelector", () => ({
  DateSelector: ({ field }: any) => <input data-testid="date-selector" name={field.hqlName} type="date" />,
}));

jest.mock("@/components/Form/FormView/selectors/DatetimeSelector", () => {
  return function DatetimeSelector({ field }: { field: { hqlName: string } }) {
    return <input data-testid="datetime-selector" name={field.hqlName} type="datetime-local" />;
  };
});

jest.mock("@/components/Form/FormView/selectors/SelectSelector", () => ({
  SelectSelector: ({ field }: any) => <select data-testid="select-selector" name={field.hqlName} />,
}));

jest.mock("@/components/Form/FormView/selectors/TableDirSelector", () => ({
  TableDirSelector: ({ field }: any) => <select data-testid="tabledir-selector" name={field.hqlName} />,
}));

jest.mock("@/components/Form/FormView/selectors/QuantitySelector", () => {
  return function QuantitySelector({ field }: { field: { hqlName: string } }) {
    return <input data-testid="quantity-selector" name={field.hqlName} type="number" step="any" />;
  };
});

jest.mock("@/components/Form/FormView/selectors/ListSelector", () => ({
  ListSelector: ({ field }: any) => <select data-testid="list-selector" name={field.hqlName} />,
}));

jest.mock("../GenericSelector", () => {
  return function GenericSelector({ parameter }: any) {
    return <input data-testid="generic-selector" name={parameter.name} />;
  };
});

jest.mock("@/components/Label", () => {
  return function Label({ name }: any) {
    return <label data-testid="parameter-label">{name}</label>;
  };
});

// Test wrapper component with form context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const form = useForm();
  return <FormProvider {...form}>{children}</FormProvider>;
};

describe("ProcessParameterSelector", () => {
  const baseParameter = {
    id: "test-id",
    name: "Test Parameter",
    dBColumnName: "test_column",
    reference: "String",
    mandatory: false,
    defaultValue: "",
    refList: [],
  } as any;

  it("should render parameter label correctly", () => {
    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={baseParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("parameter-label")).toHaveTextContent("Test Parameter");
  });

  it("should show mandatory indicator when parameter is mandatory", () => {
    const mandatoryParameter = { ...baseParameter, mandatory: true };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={mandatoryParameter} />
      </TestWrapper>
    );

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should render PasswordSelector for password reference", () => {
    const passwordParameter = { ...baseParameter, reference: "Password" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={passwordParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("password-selector")).toBeInTheDocument();
    expect(screen.getByTestId("password-selector")).toHaveAttribute("type", "password");
  });

  it("should render BooleanSelector for boolean reference", () => {
    const booleanParameter = { ...baseParameter, reference: "Yes/No" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={booleanParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("boolean-selector")).toBeInTheDocument();
    expect(screen.getByTestId("boolean-selector")).toHaveAttribute("type", "checkbox");
  });

  it("should render NumericSelector for numeric references", () => {
    const numericParameter = { ...baseParameter, reference: "Amount" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={numericParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("numeric-selector")).toBeInTheDocument();
    expect(screen.getByTestId("numeric-selector")).toHaveAttribute("type", "number");
  });

  it("should render GenericSelector for unsupported references", () => {
    const textParameter = { ...baseParameter, reference: "String" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={textParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("generic-selector")).toBeInTheDocument();
  });

  it("should render GenericSelector as fallback for unknown references", () => {
    const unknownParameter = { ...baseParameter, reference: "UnknownType" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={unknownParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("generic-selector")).toBeInTheDocument();
  });

  it("should handle parameters without reference type", () => {
    const parameterWithoutReference = { ...baseParameter };
    delete parameterWithoutReference.reference;

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={parameterWithoutReference} />
      </TestWrapper>
    );

    expect(screen.getByTestId("generic-selector")).toBeInTheDocument();
  });

  it("should render with description as title attribute", () => {
    const parameterWithDescription = {
      ...baseParameter,
      description: "This is a test parameter description",
    };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={parameterWithDescription} />
      </TestWrapper>
    );

    const container = screen.getByTitle("This is a test parameter description");
    expect(container).toBeInTheDocument();
  });

  it("should handle integer reference as numeric type", () => {
    const integerParameter = { ...baseParameter, reference: "Integer" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={integerParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("numeric-selector")).toBeInTheDocument();
  });

  it("should handle different boolean reference formats", () => {
    const booleanFormats = ["Yes/No", "YesNo", "Boolean"];

    booleanFormats.forEach((format, index) => {
      const { unmount } = render(
        <TestWrapper>
          <ProcessParameterSelector parameter={{ ...baseParameter, reference: format, id: `test-${index}` }} />
        </TestWrapper>
      );

      expect(screen.getByTestId("boolean-selector")).toBeInTheDocument();
      unmount();
    });
  });

  it("should render DateSelector for date reference", () => {
    const dateParameter = { ...baseParameter, reference: "Date" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={dateParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("date-selector")).toBeInTheDocument();
    expect(screen.getByTestId("date-selector")).toHaveAttribute("type", "date");
  });

  it("should render DatetimeSelector for datetime reference", () => {
    const datetimeParameter = { ...baseParameter, reference: "DateTime" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={datetimeParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("datetime-selector")).toBeInTheDocument();
    expect(screen.getByTestId("datetime-selector")).toHaveAttribute("type", "datetime-local");
  });

  it("should render SelectSelector for select reference", () => {
    const selectParameter = { ...baseParameter, reference: "Select" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={selectParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("select-selector")).toBeInTheDocument();
  });

  it("should render TableDirSelector for product reference", () => {
    const productParameter = { ...baseParameter, reference: "Product" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={productParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("tabledir-selector")).toBeInTheDocument();
  });

  it("should render TableDirSelector for table directory reference", () => {
    const tableDirParameter = { ...baseParameter, reference: "TableDir" };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={tableDirParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("tabledir-selector")).toBeInTheDocument();
  });

  it("should render QuantitySelector for quantity references", () => {
    const quantityFormats = ["Quantity"];

    quantityFormats.forEach((format, index) => {
      const { unmount } = render(
        <TestWrapper>
          <ProcessParameterSelector parameter={{ ...baseParameter, reference: format, id: `test-quantity-${index}` }} />
        </TestWrapper>
      );

      expect(screen.getByTestId("quantity-selector")).toBeInTheDocument();
      expect(screen.getByTestId("quantity-selector")).toHaveAttribute("type", "number");
      expect(screen.getByTestId("quantity-selector")).toHaveAttribute("step", "any");
      unmount();
    });
  });

  it("should render ListSelector for list reference", () => {
    const listParameter = {
      ...baseParameter,
      reference: "List",
      refList: [
        { id: "1", label: "Option 1", value: "opt1" },
        { id: "2", label: "Option 2", value: "opt2" },
      ],
    };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={listParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("list-selector")).toBeInTheDocument();
  });

  it("should fallback to GenericSelector for list without options", () => {
    const listParameter = { ...baseParameter, reference: "List", refList: [] };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={listParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("generic-selector")).toBeInTheDocument();
  });
});
