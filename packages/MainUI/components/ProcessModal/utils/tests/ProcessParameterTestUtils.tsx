import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { ProcessParameterSelector } from "../../selectors/ProcessParameterSelector";
import type React from "react";
export const basicParameter = {
  id: "param-1",
  name: "Test Parameter",
  dBColumnName: "test_parameter",
  reference: "String",
  mandatory: false,
  defaultValue: "",
  refList: [],
  displayLogic: "",
  readOnlyLogicExpression: "",
};

export const TestWrapper = ({
  children,
  defaultValues = { dummy: "value" },
}: { children: React.ReactNode; defaultValues?: any }) => {
  const form = useForm({ defaultValues });
  return <FormProvider {...form}>{children}</FormProvider>;
};

export const setupParameterTest = (parameter: any, logicFields?: any) => {
  render(
    <TestWrapper>
      <ProcessParameterSelector parameter={parameter} logicFields={logicFields} />
    </TestWrapper>
  );
  return screen;
};
