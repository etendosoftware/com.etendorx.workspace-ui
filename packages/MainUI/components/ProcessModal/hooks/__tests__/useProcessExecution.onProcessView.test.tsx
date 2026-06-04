import { renderHook } from "@testing-library/react";
import type { ViewController, ViewData } from "@/utils/processes/definition/scriptProxies";
import { useProcessExecution } from "../useProcessExecution";
import { makeParams } from "../testUtils/makeProcessExecutionParams";

// Capture the second argument (the view) passed to the onProcess string function.
const executeStringFunction = jest.fn(async () => ({}));
jest.mock("@/utils/functions", () => ({
  executeStringFunction: (...args: unknown[]) => executeStringFunction(...args),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("sonner", () => ({ toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }) }));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const makeViewController = (): ViewController => ({
  refresh: jest.fn(),
  fireOnPause: jest.fn(),
  handleReadOnlyLogic: jest.fn(),
  handleButtonsStatus: jest.fn(),
  getSelection: jest.fn(() => []),
  selectAllRecords: jest.fn(),
  getFooterButtons: jest.fn(() => []),
  setCancelHidden: jest.fn(),
  setCloseHidden: jest.fn(),
});

describe("useProcessExecution — onProcess second argument is the canonical view", () => {
  beforeEach(() => executeStringFunction.mockClear());

  it("passes a view carrying the legacy data fields and the view surface", async () => {
    const formValues = { DocAction: "CO" };
    const viewData: ViewData = { windowId: "WIN-001", parentRecord: { docStatus: "DR" } };

    const params = makeParams({
      etmetaOnprocess: "async (process, view) => view",
      tab: { id: "TAB-001", window: "WIN-001", entityName: "C_Invoice" },
      selectedRecords: [{ id: "rec-1" }, { id: "rec-2" }],
      viewController: makeViewController(),
      viewData,
      form: { getValues: jest.fn(() => formValues), setValue: jest.fn() },
    });

    const { result } = renderHook(() => useProcessExecution(params as never));
    await result.current.handleExecute("CO");
    await flushPromises();

    expect(executeStringFunction).toHaveBeenCalledTimes(1);
    const view = executeStringFunction.mock.calls[0][3] as Record<string, unknown>;

    // Legacy data fields the migrated scripts read directly off arg 2.
    expect(view.recordIds).toEqual(["rec-1", "rec-2"]);
    expect(view.windowId).toBe("WIN-001");
    expect(view._buttonValue).toBe("CO");

    // Full view surface available on the same object.
    expect(typeof view.refresh).toBe("function");
    expect(typeof view.getContextInfo).toBe("function");
    expect((view.getContextInfo as () => Record<string, unknown>)()).toEqual({ docStatus: "DR", DocAction: "CO" });
  });
});
