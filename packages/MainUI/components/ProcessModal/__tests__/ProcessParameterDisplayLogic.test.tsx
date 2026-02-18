import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { ProcessParameterSelector } from "../selectors/ProcessParameterSelector";
import React from "react";

// Mock dependencies
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ session: { contextValue: "test" } }),
}));

jest.mock("../selectors/GenericSelector", () => {
  return function GenericSelector({ parameter }: any) {
    return <input data-testid="generic-field" name={parameter.name} />;
  };
});

jest.mock("@/components/Label", () => {
  return function Label({ name }: any) {
    return <div data-testid="field-label">{name}</div>;
  };
});

// Mock compileExpression to evaluate simple logic
jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: (expression: string) => {
    return (session: any, values: any) => {
      // Simple mock implementation of expression evaluation
      if (expression === "@testContext@ == 'test'") return true;
      if (expression === "@testContext@ == 'fail'") return false;
      if (expression === "true") return true;
      if (expression === "false") return false;
      return true; // Default to true
    };
  },
}));

const TestWrapper = ({
  children,
  defaultValues = { dummy: "value" },
}: { children: React.ReactNode; defaultValues?: any }) => {
  const form = useForm({ defaultValues });
  return <FormProvider {...form}>{children}</FormProvider>;
};

describe("ProcessParameterSelector Display Logic", () => {
  const basicParameter = {
    id: "param-1",
    name: "Test Parameter",
    dBColumnName: "test_parameter",
    reference: "String",
    mandatory: false,
    defaultValue: "",
    refList: [],
    displayLogic: "",
  };

  it("should display parameter by default when no display logic is present", () => {
    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={basicParameter} />
      </TestWrapper>
    );

    expect(screen.getByTestId("generic-field")).toBeInTheDocument();
  });

  it("should hide parameter when logicFields explicitly hides it", () => {
    // logicFields key format: "parameterName.display"
    const logicFields = {
      "Test Parameter.display": false,
    };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={basicParameter} logicFields={logicFields} />
      </TestWrapper>
    );

    expect(screen.queryByTestId("generic-field")).not.toBeInTheDocument();
  });

  it("should show parameter when logicFields explicitly shows it", () => {
    const logicFields = {
      "Test Parameter.display": true,
    };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={basicParameter} logicFields={logicFields} />
      </TestWrapper>
    );

    expect(screen.getByTestId("generic-field")).toBeInTheDocument();
  });

  it("should evaluate parameter displayLogic when logicFields is not present", () => {
    // Using the mocked compileExpression
    const parameterWithLogic = {
      ...basicParameter,
      displayLogic: "@testContext@ == 'fail'", // Should evaluate to false
    };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={parameterWithLogic} />
      </TestWrapper>
    );

    expect(screen.queryByTestId("generic-field")).not.toBeInTheDocument();
  });

  it("should fallback to parameter display logic if logicFields is undefined for this param", () => {
    const parameterWithLogic = {
      ...basicParameter,
      displayLogic: "@testContext@ == 'test'", // Should evaluate to true
    };

    // logicFields exists but not for this parameter
    const logicFields = {
      "OtherParam.display": false,
    };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={parameterWithLogic} logicFields={logicFields} />
      </TestWrapper>
    );

    expect(screen.getByTestId("generic-field")).toBeInTheDocument();
  });

  it("should prioritize logicFields over parameter displayLogic", () => {
    const parameterWithLogic = {
      ...basicParameter,
      displayLogic: "@testContext@ == 'test'", // Should evaluate to true
    };

    // logicFields says FALSE
    const logicFields = {
      "Test Parameter.display": false,
    };

    render(
      <TestWrapper>
        <ProcessParameterSelector parameter={parameterWithLogic} logicFields={logicFields} />
      </TestWrapper>
    );

    expect(screen.queryByTestId("generic-field")).not.toBeInTheDocument();
  });

  it("should render hidden input for auxiliary logic fields even if display is false", () => {
    const auxiliaryParameter = {
      ...basicParameter,
      name: "some_display_logic", // Ends with _display_logic
      dBColumnName: "some_display_logic", // Ensure dBColumnName matches so we can find it easily
      displayLogic: "false", // Should be hidden
    };

    const { container } = render(
      <TestWrapper>
        <ProcessParameterSelector parameter={auxiliaryParameter} />
      </TestWrapper>
    );

    // Should NOT render generic-field (selector)
    expect(screen.queryByTestId("generic-field")).not.toBeInTheDocument();

    // Should render hidden input
    // We can find it by looking for an input with the name
    const hiddenInput = container.querySelector('input[name="some_display_logic"]');
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput).toHaveAttribute("type", "hidden");
  });
});
