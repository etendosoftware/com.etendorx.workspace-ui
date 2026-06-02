import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";
import type { FieldController } from "@/utils/processes/definition/scriptProxies";
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

/**
 * Mounts a real react-hook-form instance plus the hook under test, sharing the
 * same `form` reference. Returns helpers to drive value changes.
 */
function setup(
  parameters: Record<string, ProcessParameter>,
  context: Record<string, unknown>,
  fieldController?: FieldController
) {
  const formHook = renderHook(() => useForm({ defaultValues: { p1: "", p2: "" } }));
  const form = formHook.result.current;
  const hookRender = renderHook(() =>
    useParameterChangeHooks({ form, parameters, context, messageBar, fieldController })
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
});
