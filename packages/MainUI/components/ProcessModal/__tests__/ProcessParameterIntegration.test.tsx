/**
 * Integration test to verify the ProcessParameterSelector works with different field types
 * This test simulates the actual usage in ProcessDefinitionModal
 */
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { ProcessParameterSelector } from "../selectors/ProcessParameterSelector";

// Mock dependencies
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ session: {} })
}));

jest.mock("@/components/Form/FormView/selectors/PasswordSelector", () => ({
  PasswordSelector: ({ field }: any) => <input data-testid="password-field" name={field.hqlName} type="password" />
}));

jest.mock("@/components/Form/FormView/selectors/BooleanSelector", () => ({
  BooleanSelector: ({ field }: any) => <input data-testid="boolean-field" name={field.hqlName} type="checkbox" />
}));

jest.mock("@/components/Form/FormView/selectors/NumericSelector", () => ({
  NumericSelector: ({ field }: any) => <input data-testid="numeric-field" name={field.hqlName} type="number" />
}));

jest.mock("@/components/Form/FormView/selectors/DateSelector", () => ({
  DateSelector: ({ field }: any) => <input data-testid="date-field" name={field.hqlName} type="date" />
}));

jest.mock("@/components/Form/FormView/selectors/DatetimeSelector", () => ({
  DatetimeSelector: ({ field }: any) => <input data-testid="datetime-field" name={field.hqlName} type="datetime-local" />
}));

jest.mock("@/components/Form/FormView/selectors/SelectSelector", () => ({
  SelectSelector: ({ field }: any) => <select data-testid="select-field" name={field.hqlName} />
}));

jest.mock("@/components/Form/FormView/selectors/TableDirSelector", () => ({
  TableDirSelector: ({ field }: any) => <select data-testid="tabledir-field" name={field.hqlName} />
}));

jest.mock("@/components/Form/FormView/selectors/QuantitySelector", () => {
  return function QuantitySelector({ field }: any) {
    return <input data-testid="quantity-field" name={field.hqlName} type="number" step="any" />;
  };
});

jest.mock("../selectors/GenericSelector", () => {
  return function GenericSelector({ parameter }: any) {
    return <input data-testid="generic-field" name={parameter.name} />;
  };
});

jest.mock("@/components/Label", () => {
  return function Label({ name }: any) {
    return <label data-testid="field-label">{name}</label>;
  };
});

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const form = useForm();
  return <FormProvider {...form}>{children}</FormProvider>;
};

describe("ProcessParameterSelector Integration", () => {
  describe("Phase 1 Field Types (Foundation)", () => {
    it("should render Password field correctly", () => {
      const passwordParameter = {
        id: "pwd-1",
        name: "User Password",
        dBColumnName: "user_password",
        reference: "Password",
        mandatory: true,
        defaultValue: "",
        refList: []
      };

      render(
        <TestWrapper>
          <ProcessParameterSelector parameter={passwordParameter} />
        </TestWrapper>
      );

      expect(screen.getByTestId("field-label")).toHaveTextContent("User Password");
      expect(screen.getByTestId("password-field")).toBeInTheDocument();
      expect(screen.getByTestId("password-field")).toHaveAttribute("type", "password");
      expect(screen.getByText("*")).toBeInTheDocument(); // Mandatory indicator
    });

    it("should render Boolean field correctly", () => {
      const booleanParameter = {
        id: "bool-1",
        name: "Is Active",
        dBColumnName: "is_active",
        reference: "Yes/No",
        mandatory: false,
        defaultValue: "N",
        refList: []
      };

      render(
        <TestWrapper>
          <ProcessParameterSelector parameter={booleanParameter} />
        </TestWrapper>
      );

      expect(screen.getByTestId("field-label")).toHaveTextContent("Is Active");
      expect(screen.getByTestId("boolean-field")).toBeInTheDocument();
      expect(screen.getByTestId("boolean-field")).toHaveAttribute("type", "checkbox");
      expect(screen.queryByText("*")).not.toBeInTheDocument(); // Not mandatory
    });

    it("should render Numeric field correctly", () => {
      const numericParameter = {
        id: "num-1",
        name: "Payment Amount",
        dBColumnName: "payment_amount",
        reference: "Amount",
        mandatory: true,
        defaultValue: "0.00",
        refList: []
      };

      render(
        <TestWrapper>
          <ProcessParameterSelector parameter={numericParameter} />
        </TestWrapper>
      );

      expect(screen.getByTestId("field-label")).toHaveTextContent("Payment Amount");
      expect(screen.getByTestId("numeric-field")).toBeInTheDocument();
      expect(screen.getByTestId("numeric-field")).toHaveAttribute("type", "number");
      expect(screen.getByText("*")).toBeInTheDocument(); // Mandatory indicator
    });

    it("should handle Integer reference as numeric", () => {
      const integerParameter = {
        id: "int-1",
        name: "Quantity",
        dBColumnName: "quantity",
        reference: "Integer",
        mandatory: false,
        defaultValue: "1",
        refList: []
      };

      render(
        <TestWrapper>
          <ProcessParameterSelector parameter={integerParameter} />
        </TestWrapper>
      );

      expect(screen.getByTestId("numeric-field")).toBeInTheDocument();
    });
  });

  describe("Fallback Behavior", () => {
    it("should use GenericSelector for unsupported field types", () => {
      const unsupportedParameter = {
        id: "unsup-1",
        name: "Complex Field",
        dBColumnName: "complex_field",
        reference: "ComplexType",
        mandatory: false,
        defaultValue: "",
        refList: []
      };

      render(
        <TestWrapper>
          <ProcessParameterSelector parameter={unsupportedParameter} />
        </TestWrapper>
      );

      expect(screen.getByTestId("field-label")).toHaveTextContent("Complex Field");
      expect(screen.getByTestId("generic-field")).toBeInTheDocument();
    });

    it("should use GenericSelector for String/Text types (current behavior)", () => {
      const textParameter = {
        id: "text-1",
        name: "Description",
        dBColumnName: "description",
        reference: "String",
        mandatory: false,
        defaultValue: "",
        refList: []
      };

      render(
        <TestWrapper>
          <ProcessParameterSelector parameter={textParameter} />
        </TestWrapper>
      );

      expect(screen.getByTestId("field-label")).toHaveTextContent("Description");
      expect(screen.getByTestId("generic-field")).toBeInTheDocument();
    });
  });

  describe("Field Mapping Quality", () => {
    it("should handle parameters without dBColumnName", () => {
      const parameterWithoutDbColumn = {
        id: "no-db-col",
        name: "Display Name",
        reference: "Boolean",
        mandatory: false,
        defaultValue: "N",
        refList: []
      };

      render(
        <TestWrapper>
          <ProcessParameterSelector parameter={parameterWithoutDbColumn} />
        </TestWrapper>
      );

      expect(screen.getByTestId("boolean-field")).toBeInTheDocument();
      expect(screen.getByTestId("boolean-field")).toHaveAttribute("name", "Display Name");
    });

    it("should handle different boolean reference formats", () => {
      const booleanFormats = ["Yes/No", "YesNo", "Boolean"];
      
      booleanFormats.forEach((format, index) => {
        const { unmount } = render(
          <TestWrapper>
            <ProcessParameterSelector 
              parameter={{
                id: `bool-${index}`,
                name: `Boolean Field ${index}`,
                dBColumnName: `bool_field_${index}`,
                reference: format,
                mandatory: false,
                defaultValue: "N",
                refList: []
              }} 
            />
          </TestWrapper>
        );
        
        expect(screen.getByTestId("boolean-field")).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Progress Tracking", () => {
    it("should support 9 out of 11 field reference types (82% Phase 2 target)", () => {
      // Phase 1 + Phase 2 supported types: Password, Boolean, Numeric, Date, DateTime, Select, Product, TableDir, Quantity
      const supportedTypes = [
        "Password", "Yes/No", "Boolean", "Amount", "Integer", "Decimal", "Quantity",
        "Date", "DateTime", "Select", "Product", "TableDir", "Table Directory"
      ];
      
      // Phase 3 types (future): List, Window, String, etc.
      const futureTypes = ["List", "Window", "String"];
      
      // Test that Phase 1 + Phase 2 types work correctly
      supportedTypes.forEach((type, index) => {
        const { unmount } = render(
          <TestWrapper>
            <ProcessParameterSelector 
              parameter={{
                id: `supported-${index}`,
                name: `Supported Field ${index}`,
                dBColumnName: `supported_field_${index}`,
                reference: type,
                mandatory: false,
                defaultValue: "",
                refList: []
              }} 
            />
          </TestWrapper>
        );
        
        // Should render specialized selector (not generic)
        const hasSpecializedSelector = 
          screen.queryByTestId("password-field") ||
          screen.queryByTestId("boolean-field") ||
          screen.queryByTestId("numeric-field") ||
          screen.queryByTestId("date-field") ||
          screen.queryByTestId("datetime-field") ||
          screen.queryByTestId("select-field") ||
          screen.queryByTestId("tabledir-field") ||
          screen.queryByTestId("quantity-field");
          
        expect(hasSpecializedSelector).toBeInTheDocument();
        unmount();
      });
      
      // Verify future types fall back to GenericSelector
      futureTypes.forEach((type, index) => {
        const { unmount } = render(
          <TestWrapper>
            <ProcessParameterSelector 
              parameter={{
                id: `future-${index}`,
                name: `Future Field ${index}`,
                dBColumnName: `future_field_${index}`,
                reference: type,
                mandatory: false,
                defaultValue: "",
                refList: []
              }} 
            />
          </TestWrapper>
        );
        
        expect(screen.getByTestId("generic-field")).toBeInTheDocument();
        unmount();
      });
    });
  });
});