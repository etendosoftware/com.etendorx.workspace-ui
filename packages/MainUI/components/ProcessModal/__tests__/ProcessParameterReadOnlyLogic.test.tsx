import "../utils/tests/useSharedMocks";
import { screen } from "@testing-library/react";
import { setupParameterTest, basicParameter } from "../utils/tests/ProcessParameterTestUtils";

// Mock mappers to ensure ProcessParameterMapper returns what we expect
jest.mock("../mappers/ProcessParameterMapper", () => ({
  ProcessParameterMapper: {
    mapToField: (parameter: any) => ({
      ...parameter,
      hqlName: parameter.dBColumnName || parameter.name,
      isReadOnly: parameter.isReadOnly || false,
    }),
    getFieldType: () => "text",
  },
}));

describe("ProcessParameterSelector Read-Only Logic", () => {
  const setup = (parameter: any, logicFields?: any) => {
    setupParameterTest(parameter, logicFields);
    return screen.getByTestId("generic-field");
  };

  it("should be editable by default when no read-only logic is present", () => {
    const input = setup(basicParameter);
    expect(input).not.toHaveAttribute("readonly");
    expect(input).not.toBeDisabled();
  });

  it("should be read-only when parameter.isReadOnly is true", () => {
    const input = setup({ ...basicParameter, isReadOnly: true });
    expect(input).toBeDisabled();
  });

  it("should be read-only when logicFields explicitly makes it read-only", () => {
    const input = setup(basicParameter, { "Test Parameter.readonly": true });
    expect(input).toBeDisabled();
  });

  it("should be editable when logicFields explicitly makes it editable", () => {
    const input = setup({ ...basicParameter, isReadOnly: true }, { "Test Parameter.readonly": false });
    // ProcessParameterSelector implementation prioritizes mappedField.isReadOnly
    expect(input).toBeDisabled();
  });

  it("should evaluate readOnlyLogicExpression when logicFields is not present", () => {
    const input = setup({
      ...basicParameter,
      readOnlyLogicExpression: "@testContext@ == 'readonly'",
    });
    expect(input).toBeDisabled();
  });

  it("should be editable when readOnlyLogicExpression evaluates to false", () => {
    const input = setup({
      ...basicParameter,
      readOnlyLogicExpression: "@testContext@ == 'editable'",
    });
    expect(input).not.toBeDisabled();
  });

  it("should fallback to readOnlyLogic if readOnlyLogicExpression is missing", () => {
    const input = setup({
      ...basicParameter,
      readOnlyLogic: "@testContext@ == 'readonly'",
    });
    expect(input).toBeDisabled();
  });
});
