import { render, screen } from "@testing-library/react";
import BaseSelector from "../BaseSelector";
import { useUserContext } from "@/hooks/useUserContext";
import { useForm } from "react-hook-form";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";

jest.mock("@/hooks/useUserContext");
jest.mock("react-hook-form");
jest.mock("@/components/Form/FormView/selectors/BaseSelector");
jest.mock("../GenericSelector", () => ({
  __esModule: true,
  default: ({ readOnly }: { readOnly: boolean }) => (
    <div data-testid="mock-generic-selector" data-readonly={readOnly} />
  ),
}));
jest.mock("@/components/Label", () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <label>{name}</label>,
}));

describe("BaseSelector", () => {
  const mockParameter = {
    dBColumnName: "test_col",
    name: "Test Parameter",
    mandatory: true,
    readOnlyLogicExpression: "1 == 1",
  } as any;

  beforeEach(() => {
    (useUserContext as jest.Mock).mockReturnValue({ session: {} });
    (useForm as jest.Mock).mockReturnValue({ getValues: jest.fn() });
    (compileExpression as jest.Mock).mockReturnValue(() => true);
  });

  it("should render label and generic selector", () => {
    render(<BaseSelector parameter={mockParameter} />);

    expect(screen.getByText("Test Parameter")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByTestId("mock-generic-selector")).toBeInTheDocument();
  });

  it("should calculate readOnly based on expression", () => {
    (compileExpression as jest.Mock).mockReturnValue(() => true);
    render(<BaseSelector parameter={mockParameter} />);

    const selector = screen.getByTestId("mock-generic-selector");
    expect(selector.getAttribute("data-readonly")).toBe("true");
  });

  it("should handle error in expression execution", () => {
    (compileExpression as jest.Mock).mockReturnValue(() => {
      throw new Error("fail");
    });
    render(<BaseSelector parameter={mockParameter} />);

    const selector = screen.getByTestId("mock-generic-selector");
    expect(selector.getAttribute("data-readonly")).toBe("true"); // Fallback to readOnly: true on error
  });

  it("should handle missing readOnlyLogicExpression", () => {
    const paramNoLogic = { ...mockParameter, readOnlyLogicExpression: null };
    render(<BaseSelector parameter={paramNoLogic} />);

    const selector = screen.getByTestId("mock-generic-selector");
    expect(selector.getAttribute("data-readonly")).toBe("false");
  });
});
