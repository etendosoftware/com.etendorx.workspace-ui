import { renderHook } from "@testing-library/react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useRecordDisplayLogic } from "../useRecordDisplayLogic";

const mockCompiled = jest.fn();
jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: () => mockCompiled,
}));
const mockContext = jest.fn();
jest.mock("@/utils/evaluation/sharedEvaluationContext", () => ({
  getEvaluationContext: (...args: unknown[]) => mockContext(...args),
}));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn(), error: jest.fn() } }));
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: unknown) => unknown) => selector({ session: { "#User": "u" } }),
}));

let tabContext: Record<string, unknown>;
jest.mock("@/contexts/tab", () => ({ useTabContext: () => tabContext }));

const field = (displayLogicExpression?: string) => ({ name: "F", displayLogicExpression }) as unknown as Field;

describe("useRecordDisplayLogic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tabContext = { tab: { window: "w", fields: {} }, record: { a: "Y" }, parentRecord: undefined };
    mockContext.mockReturnValue({ ctx: true });
  });

  it("shows a field that has no display logic", () => {
    const { result } = renderHook(() => useRecordDisplayLogic());

    expect(result.current(field())).toBe(true);
    expect(mockCompiled).not.toHaveBeenCalled();
  });

  it("shows every field while there is no tab", () => {
    tabContext = {};
    const { result } = renderHook(() => useRecordDisplayLogic());

    expect(result.current(field("@a@='Y'"))).toBe(true);
  });

  it.each([
    [true, true],
    [false, false],
    ["N", false],
  ])("evaluates the logic against the record (%p gives %p)", (value, expected) => {
    mockCompiled.mockReturnValue(value);
    const { result } = renderHook(() => useRecordDisplayLogic());

    expect(result.current(field("@a@='Y'"))).toBe(expected);
    expect(mockContext).toHaveBeenCalledWith(expect.objectContaining({ values: { a: "Y" }, windowId: "w" }), {});
  });

  it("keeps the field listed as shown when the logic cannot be evaluated", () => {
    mockCompiled.mockImplementation(() => {
      throw new Error("bad expression");
    });
    const { result } = renderHook(() => useRecordDisplayLogic());

    expect(result.current(field("@a@='Y'"))).toBe(true);
  });
});
