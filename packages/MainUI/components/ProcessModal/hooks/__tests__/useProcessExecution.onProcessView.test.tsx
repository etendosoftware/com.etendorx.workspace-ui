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

  it("exposes the full selected records, nested and flat (regression: Manual handlers read record fields)", async () => {
    // Manual handlers ported from Classic read fields off the launching grid's
    // selection, not just its ids — the SII senders send `selection[0].organization`
    // as `orgid`. onProcess used to expose recordIds only, and the migrated bodies
    // read `view.hookData.selectedRecords`, which resolved to undefined twice over.
    const selectedRecords = [
      { id: "inv-1", organization: "ORG-1" },
      { id: "inv-2", organization: "ORG-1" },
    ];
    const params = makeParams({
      etmetaOnprocess: "async (process, view) => view",
      tab: { id: "TAB-001", window: "WIN-001", entityName: "C_Invoice" },
      selectedRecords,
      viewController: makeViewController(),
      form: { getValues: jest.fn(() => ({})), setValue: jest.fn() },
    });

    const { result } = renderHook(() => useProcessExecution(params as never));
    await result.current.handleExecute("DONE");
    await flushPromises();

    const view = executeStringFunction.mock.calls[0][3] as Record<string, unknown>;
    const hookData = view.hookData as Record<string, unknown>;

    expect(hookData.selectedRecords).toEqual(selectedRecords);
    expect(hookData.recordIds).toEqual(["inv-1", "inv-2"]);
    // The same fields stay reachable flat, for scripts written against that form.
    expect(view.selectedRecords).toEqual(selectedRecords);
  });

  it("threads the fieldController into the view so onProcess items are live (regression: item.isVisible)", async () => {
    // Before the fix, useProcessExecution received no fieldController, so view.theForm
    // built deferred items with no isVisible() — making a guarded `field.isVisible &&
    // field.isVisible()` expression evaluate to undefined and silently drop from the
    // callAction payload (the Add Payment `generatesCredit` defect).
    const isDisplayed = jest.fn(() => false);
    const fieldController = {
      setRequired: jest.fn(),
      setDisabled: jest.fn(),
      setDisplayed: jest.fn(),
      isDisplayed,
      setTitle: jest.fn(),
      setValueMap: jest.fn(),
      getValueMap: jest.fn(() => []),
      addField: jest.fn(),
      removeField: jest.fn(),
      focusField: jest.fn(),
    };
    const params = makeParams({
      etmetaOnprocess: "async (process, view) => view",
      tab: { id: "TAB-001", window: "WIN-001", entityName: "C_Invoice" },
      viewController: makeViewController(),
      fieldController,
      parameters: { overpayment_action: { name: "overpayment_action", dBColumnName: "overpayment_action" } },
      form: { getValues: jest.fn(() => ({})), setValue: jest.fn() },
    });

    const { result } = renderHook(() => useProcessExecution(params as never));
    await result.current.handleExecute("DONE");
    await flushPromises();

    const view = executeStringFunction.mock.calls[0][3] as Record<string, unknown>;
    const theForm = view.theForm as { getItem: (name: string) => Record<string, unknown> };
    const item = theForm.getItem("overpayment_action");

    expect(typeof item.isVisible).toBe("function");
    expect((item.isVisible as () => boolean)()).toBe(false);
    expect(isDisplayed).toHaveBeenCalledWith("overpayment_action");
  });
});
