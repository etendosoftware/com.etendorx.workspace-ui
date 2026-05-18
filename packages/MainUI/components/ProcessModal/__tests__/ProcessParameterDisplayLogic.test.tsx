import "../utils/tests/useSharedMocks";
import { screen } from "@testing-library/react";
import { setupParameterTest, basicParameter } from "../utils/tests/ProcessParameterTestUtils";

describe("ProcessParameterSelector Display Logic", () => {
  it("should display parameter by default when no display logic is present", () => {
    setupParameterTest(basicParameter);
    expect(screen.getByTestId("generic-field")).toBeInTheDocument();
  });

  it("should hide parameter when logicFields explicitly hides it", () => {
    // logicFields key format: "parameterName.display"
    setupParameterTest(basicParameter, { "Test Parameter.display": false });
    expect(screen.queryByTestId("generic-field")).not.toBeInTheDocument();
  });

  it("should show parameter when logicFields explicitly shows it", () => {
    setupParameterTest(basicParameter, { "Test Parameter.display": true });
    expect(screen.getByTestId("generic-field")).toBeInTheDocument();
  });

  it("should evaluate parameter displayLogic when logicFields is not present", () => {
    // Using the mocked compileExpression
    setupParameterTest({
      ...basicParameter,
      displayLogic: "@testContext@ == 'fail'", // Should evaluate to false
    });
    expect(screen.queryByTestId("generic-field")).not.toBeInTheDocument();
  });

  it("should fallback to parameter display logic if logicFields is undefined for this param", () => {
    setupParameterTest({ ...basicParameter, displayLogic: "@testContext@ == 'test'" }, { "OtherParam.display": false });
    expect(screen.getByTestId("generic-field")).toBeInTheDocument();
  });

  it("should prioritize logicFields over parameter displayLogic", () => {
    setupParameterTest(
      { ...basicParameter, displayLogic: "@testContext@ == 'test'" },
      { "Test Parameter.display": false }
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

    setupParameterTest(auxiliaryParameter);

    // Should NOT render generic-field (selector)
    expect(screen.queryByTestId("generic-field")).not.toBeInTheDocument();

    // Should render hidden input
    const hiddenInput = document.querySelector('input[name="some_display_logic"]');
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput).toHaveAttribute("type", "hidden");
  });
});
