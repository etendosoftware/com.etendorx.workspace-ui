import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useExpressionDependencies } from "../useExpressionDependencies";

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({ tab: { fields: {} } }),
}));

const render = (defaultValues: Record<string, unknown>, expression: string) => {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const methods = useForm({ defaultValues });
    return <FormProvider {...methods}>{children}</FormProvider>;
  };
  return renderHook(() => useExpressionDependencies(expression), { wrapper: Wrapper }).result.current;
};

describe("useExpressionDependencies (ETP-6335)", () => {
  it("returns the values the form holds for the columns the expression reads", () => {
    const values = render({ processed: true }, `currentValues["processed"] === true`);

    expect(values).toEqual({ processed: true });
  });

  it("leaves out a column the form does not hold, so it cannot hide the value of the parent record", () => {
    const values = render({ processed: true }, `currentValues["documentNo"] === '50014'`);

    expect(Object.keys(values)).not.toContain("documentNo");
  });
});
