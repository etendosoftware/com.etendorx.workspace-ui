import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { type createProcessExpressionContext, isParameterDisplayed } from "../processExpressionUtils";

jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: jest.fn(),
}));

const mockCompile = compileExpression as jest.Mock;

// Shared fixtures to avoid repeating literals across cases.
const PARAM_NAME = "Overpayment Action";
const DISPLAY_KEY = `${PARAM_NAME}.display`;
const DISPLAY_LOGIC = "@overpayment_action_display_logic@==='Y'";
const VALUES = { foo: "bar" };
// compileExpression is mocked, so the concrete context is never read; a stub satisfies the type.
const CONTEXT = {} as ReturnType<typeof createProcessExpressionContext>;

const makeParameter = (overrides: Partial<ProcessParameter> = {}): ProcessParameter =>
  ({ name: PARAM_NAME, dBColumnName: "overpayment_action", ...overrides }) as ProcessParameter;

const displayedWith = (overrides: Partial<Parameters<typeof isParameterDisplayed>[0]> = {}) =>
  isParameterDisplayed({ parameter: makeParameter(), values: VALUES, evaluationContext: CONTEXT, ...overrides });

beforeEach(() => {
  mockCompile.mockReset();
});

describe("isParameterDisplayed", () => {
  it("gives the explicit display override precedence over display logic", () => {
    const result = isParameterDisplayed({
      parameter: makeParameter({ displayLogic: DISPLAY_LOGIC }),
      logicFields: { [DISPLAY_KEY]: false },
      values: VALUES,
      evaluationContext: CONTEXT,
    });
    expect(result).toBe(false);
    expect(mockCompile).not.toHaveBeenCalled();
  });

  it("returns the override value (true) without evaluating display logic", () => {
    const result = displayedWith({
      logicFields: { [DISPLAY_KEY]: true },
      parameter: makeParameter({ displayLogic: DISPLAY_LOGIC }),
    });
    expect(result).toBe(true);
    expect(mockCompile).not.toHaveBeenCalled();
  });

  it("defaults to visible when the parameter has no display logic", () => {
    expect(displayedWith({})).toBe(true);
    expect(mockCompile).not.toHaveBeenCalled();
  });

  it("defaults to visible for malformed display logic that looks like a field name", () => {
    const result = displayedWith({ parameter: makeParameter({ displayLogic: "overpayment_action_logic" }) });
    expect(result).toBe(true);
    expect(mockCompile).not.toHaveBeenCalled();
  });

  it("stays hidden (fail-safe) when display logic exists but no form values are available yet", () => {
    const result = isParameterDisplayed({
      parameter: makeParameter({ displayLogic: DISPLAY_LOGIC }),
      values: {},
      evaluationContext: CONTEXT,
    });
    expect(result).toBe(false);
    expect(mockCompile).not.toHaveBeenCalled();
  });

  it("coerces the compiled expression result to a strict boolean (truthy -> true)", () => {
    mockCompile.mockReturnValue(() => 1);
    const result = displayedWith({ parameter: makeParameter({ displayLogic: DISPLAY_LOGIC }) });
    expect(result).toBe(true);
  });

  it("coerces the compiled expression result to a strict boolean (falsy -> false)", () => {
    mockCompile.mockReturnValue(() => 0);
    const result = displayedWith({ parameter: makeParameter({ displayLogic: DISPLAY_LOGIC }) });
    expect(result).toBe(false);
  });

  it("defaults to visible when evaluating the display logic throws", () => {
    mockCompile.mockImplementation(() => {
      throw new Error("boom");
    });
    const result = displayedWith({ parameter: makeParameter({ displayLogic: DISPLAY_LOGIC }) });
    expect(result).toBe(true);
  });

  it("treats bare boolean reference returning 'N' as hidden (toClassicBoolean)", () => {
    // Simulates @bank_fee@ where bank_fee = "N"
    mockCompile.mockReturnValue(() => "N");
    const result = displayedWith({
      parameter: makeParameter({ displayLogic: "@bank_fee@" }),
    });
    expect(result).toBe(false);
  });

  it("treats bare boolean reference returning 'Y' as visible (toClassicBoolean)", () => {
    mockCompile.mockReturnValue(() => "Y");
    const result = displayedWith({
      parameter: makeParameter({ displayLogic: "@bank_fee@" }),
    });
    expect(result).toBe(true);
  });
});
