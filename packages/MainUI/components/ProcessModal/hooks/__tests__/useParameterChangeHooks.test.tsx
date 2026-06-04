import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";
import type {
  FieldController,
  FooterButtonHandle,
  GridController,
  GridResolver,
  ViewController,
} from "@/utils/processes/definition/scriptProxies";
import { useParameterChangeHooks } from "../useParameterChangeHooks";

jest.mock("@/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

const messageBar = { setMessage: jest.fn(), hide: jest.fn() };

const param = (name: string, body: string | null): ProcessParameter =>
  ({ name, etmetaOnParameterChange: body }) as unknown as ProcessParameter;

/** FieldController of jest spies for asserting form-item API delegation. */
const makeController = (): FieldController => ({
  setRequired: jest.fn(),
  setDisabled: jest.fn(),
  setDisplayed: jest.fn(),
  setValueMap: jest.fn(),
  getValueMap: jest.fn(() => []),
  addField: jest.fn(),
  removeField: jest.fn(),
  focusField: jest.fn(),
});

/** ViewController of jest spies, with a configurable footer-button list. */
const makeViewController = (footerButtons: FooterButtonHandle[] = []): ViewController => ({
  refresh: jest.fn(),
  fireOnPause: jest.fn(),
  handleReadOnlyLogic: jest.fn(),
  handleButtonsStatus: jest.fn(),
  getSelection: jest.fn(() => []),
  selectAllRecords: jest.fn(),
  getFooterButtons: jest.fn(() => footerButtons),
  setCancelHidden: jest.fn(),
  setCloseHidden: jest.fn(),
});

/**
 * Mounts a real react-hook-form instance plus the hook under test, sharing the
 * same `form` reference. Returns helpers to drive value changes.
 */
function setup(
  parameters: Record<string, ProcessParameter>,
  context: Record<string, unknown>,
  fieldController?: FieldController,
  viewController?: ViewController,
  gridResolver?: GridResolver
) {
  const formHook = renderHook(() => useForm({ defaultValues: { p1: "", p2: "" } }));
  const form = formHook.result.current;
  const hookRender = renderHook(() =>
    useParameterChangeHooks({ form, parameters, context, messageBar, fieldController, viewController, gridResolver })
  );
  const change = (name: string, value: unknown) => act(() => form.setValue(name, value, { shouldDirty: true }));
  const flush = () => act(() => jest.advanceTimersByTime(300));
  return { form, hookRender, change, flush };
}

describe("useParameterChangeHooks", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    messageBar.setMessage.mockClear();
    (logger.error as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fires the compiled hook with the new value when the parameter changes", () => {
    const onChange = jest.fn();
    const { change, flush } = setup({ p1: param("p1", "(item) => onChange(item.getValue())") }, { onChange });

    change("p1", "hello");
    flush();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("does not fire when the parameter carries no hook body", () => {
    const onChange = jest.fn();
    const { change, flush } = setup({ p1: param("p1", null) }, { onChange });

    change("p1", "hello");
    flush();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not fire when the value did not actually change", () => {
    const onChange = jest.fn();
    const { change, flush } = setup({ p1: param("p1", "(item) => onChange(item.getValue())") }, { onChange });

    change("p1", ""); // same as the default value
    flush();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not re-fire when the hook sets its own parameter value (re-entrancy guard)", () => {
    const onChange = jest.fn();
    const { change, flush } = setup(
      { p1: param("p1", "(item) => { onChange(); item.setValue('echo'); }") },
      { onChange }
    );

    change("p1", "trigger");
    flush();
    flush(); // a recursive schedule would surface on a second drain

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("resolves a shared module-scope helper by bare name from the injected context", () => {
    const updateTotal = jest.fn();
    const { change, flush } = setup(
      { p1: param("p1", "(item) => updateTotal(item.getValue())") },
      { updateTotal } // helper spread into the hook context, as moduleScope does
    );

    change("p1", "hello");
    flush();

    expect(updateTotal).toHaveBeenCalledWith("hello");
  });

  it("delegates an item mutation to the field controller", () => {
    const fieldController = makeController();
    const { change, flush } = setup({ p1: param("p1", "(item) => item.setRequired(false)") }, {}, fieldController);

    change("p1", "x");
    flush();

    expect(fieldController.setRequired).toHaveBeenCalledWith("p1", false);
  });

  it("delegates a form.hideItem call to the field controller", () => {
    const fieldController = makeController();
    const { change, flush } = setup(
      { p1: param("p1", "(item, view, form) => form.hideItem('p2')"), p2: param("p2", null) },
      {},
      fieldController
    );

    change("p1", "x");
    flush();

    expect(fieldController.setDisplayed).toHaveBeenCalledWith("p2", false);
  });

  it("degrades gracefully when no controller is wired (deferred method throws, swallowed)", () => {
    const { change, flush } = setup({ p1: param("p1", "(item) => item.setRequired(false)") }, {});

    change("p1", "x");
    expect(() => flush()).not.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });

  it("stops firing after unmount", () => {
    const onChange = jest.fn();
    const { hookRender, change, flush } = setup(
      { p1: param("p1", "(item) => onChange(item.getValue())") },
      { onChange }
    );

    hookRender.unmount();
    change("p1", "late");
    flush();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("reaches the viewController from a hook calling view.refresh / view.popupButtons", () => {
    const doneButton: FooterButtonHandle = {
      _buttonValue: "DONE",
      title: "Done",
      hide: jest.fn(),
      show: jest.fn(),
      setDisabled: jest.fn(),
    };
    const viewController = makeViewController([doneButton]);
    const body = `(item, view) => {
      view.refresh();
      view.popupButtons.members.find((b) => b._buttonValue === 'DONE').hide();
    }`;
    const { change, flush } = setup({ p1: param("p1", body) }, {}, undefined, viewController);

    change("p1", "go");
    flush();

    expect(viewController.refresh).toHaveBeenCalled();
    expect(doneButton.hide).toHaveBeenCalled();
  });

  it("reaches a registered grid via view.theForm.getItem(...).canvas.viewGrid", () => {
    const selected = [{ id: "r1" }];
    const gridController = {
      getSelectedRecords: jest.fn(() => selected),
      selectRecord: jest.fn(),
      deselectRecord: jest.fn(),
      selectSingleRecord: jest.fn(),
      deselectAllRecords: jest.fn(),
      userSelectAllRecords: jest.fn(),
      getRows: jest.fn(() => selected),
      getRecord: jest.fn(),
      getRecordIndex: jest.fn(() => 0),
      getEditedRecord: jest.fn(),
      getTotalRows: jest.fn(() => 1),
      setEditValue: jest.fn(),
      getEditValues: jest.fn(() => ({})),
      getEditedCell: jest.fn(),
      invalidateCache: jest.fn(),
      fetchData: jest.fn(),
      getCriteria: jest.fn(),
      addSelectedIDsToCriteria: jest.fn(),
      getFieldByColumnName: jest.fn(),
      onDataArrived: jest.fn(),
      onSelectionChanged: jest.fn(),
    } as GridController;
    const gridResolver: GridResolver = jest.fn(() => gridController);
    const body = `(item, view) => {
      view.theForm.getItem('p1').canvas.viewGrid.invalidateCache();
    }`;
    const { change, flush } = setup({ p1: param("p1", body) }, {}, undefined, undefined, gridResolver);

    change("p1", "go");
    flush();

    expect(gridResolver).toHaveBeenCalledWith("p1");
    expect(gridController.invalidateCache).toHaveBeenCalled();
  });
});
