import type { UseFormReturn } from "react-hook-form";
import type { EntityData, ListOption, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import {
  buildGridVisibility,
  createFormHandle,
  createFormProxy,
  createGridProxy,
  createItemProxy,
  createViewProxy,
  findParameter,
  normalizeValueMapEntries,
  notImplemented,
  resolveFormKey,
  type FieldController,
  type FooterButtonHandle,
  type FormHandle,
  type GridController,
  type GridResolver,
  type MessageBarHandle,
  type ViewController,
  type ViewData,
} from "../scriptProxies";
import { compileParameterHook } from "../compileParameterHook";

const param = (name: string, dBColumnName: string): ProcessParameter =>
  ({ name, dBColumnName }) as unknown as ProcessParameter;

const PARAMETERS = {
  amount: param("amount", "amount_col"),
  currency: param("currency", "c_currency_id"),
};

const row = (id: string, extra: Record<string, unknown> = {}): EntityData => ({ id, ...extra }) as EntityData;

/** Minimal react-hook-form stub: an in-memory value map with jest spies. */
const makeFormHandle = (initial: Record<string, unknown> = {}) => {
  const values = { ...initial };
  const setValue = jest.fn((name: string, value: unknown) => {
    values[name] = value;
  });
  const handle: FormHandle = {
    getValues: (name?: string) => (name === undefined ? values : values[name]),
    setValue,
  };
  return { handle, values, setValue };
};

/** FieldController of jest spies, with an in-memory value-map store for getValueMap. */
const makeController = (valueMaps: Record<string, ListOption[]> = {}): FieldController => ({
  setRequired: jest.fn(),
  setDisabled: jest.fn(),
  setDisplayed: jest.fn(),
  setValueMap: jest.fn(),
  getValueMap: jest.fn((name: string) => valueMaps[name] ?? []),
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
  isOkButtonEnabled: jest.fn(() => false),
  enableOkButton: jest.fn(),
  openProcess: jest.fn(),
});

/** Reused launch params for the openProcess tests. */
const OPEN_PROCESS_PARAMS = { processId: "P-1", windowId: "W-1", windowTitle: "Nested" } as const;

/** GridController of jest spies, overridable per test for the read accessors. */
const makeGridController = (overrides: Partial<GridController> = {}): GridController => ({
  getSelectedRecords: jest.fn(() => []),
  selectRecord: jest.fn(),
  deselectRecord: jest.fn(),
  selectSingleRecord: jest.fn(),
  deselectAllRecords: jest.fn(),
  userSelectAllRecords: jest.fn(),
  getRows: jest.fn(() => []),
  getRecord: jest.fn(),
  getRecordIndex: jest.fn(() => -1),
  getEditedRecord: jest.fn(),
  getTotalRows: jest.fn(() => 0),
  setEditValue: jest.fn(),
  getEditValues: jest.fn(() => ({})),
  getEditedCell: jest.fn(),
  invalidateCache: jest.fn(),
  fetchData: jest.fn(),
  getCriteria: jest.fn(),
  addSelectedIDsToCriteria: jest.fn(),
  getFieldByColumnName: jest.fn(),
  setRowActions: jest.fn(),
  onDataArrived: jest.fn(),
  onSelectionChanged: jest.fn(),
  onRecordChange: jest.fn(),
  onSelectionToggle: jest.fn(),
  setColumnOnChange: jest.fn(),
  setColumnValidator: jest.fn(),
  ...overrides,
});

/** Casts a proxy method (typed `unknown` through the index signature) to a callable. */
const call = (fn: unknown) => fn as (...args: unknown[]) => unknown;

describe("scriptProxies", () => {
  describe("notImplemented", () => {
    it("throws a traceable error naming the api", () => {
      expect(() => notImplemented("grid.setEditValue")).toThrow("grid.setEditValue is not implemented yet");
    });
  });

  describe("resolveFormKey", () => {
    it("returns the param name when matched by name", () => {
      expect(resolveFormKey("currency", PARAMETERS)).toBe("currency");
    });

    it("maps a dBColumnName back to the parameter name", () => {
      expect(resolveFormKey("c_currency_id", PARAMETERS)).toBe("currency");
    });

    it("falls back to the requested name when nothing matches", () => {
      expect(resolveFormKey("unknown", PARAMETERS)).toBe("unknown");
      expect(resolveFormKey("x", undefined)).toBe("x");
    });
  });

  describe("createFormHandle", () => {
    it("delegates getValues/setValue to the react-hook-form instance", () => {
      const form = {
        getValues: jest.fn((name?: unknown) => (name === undefined ? { a: 1 } : "single")),
        setValue: jest.fn(),
      } as unknown as UseFormReturn;
      const handle = createFormHandle(form);

      expect(handle.getValues()).toEqual({ a: 1 });
      expect(handle.getValues("a")).toBe("single");
      handle.setValue("a", 2, { shouldDirty: true });
      expect(form.setValue).toHaveBeenCalledWith("a", 2, { shouldDirty: true });
    });
  });

  describe("createItemProxy", () => {
    it("reads and writes the underlying form value", () => {
      const { handle, setValue } = makeFormHandle({ amount: 10 });
      const item = createItemProxy(handle, "amount");

      expect(item.name).toBe("amount");
      expect(item.getValue()).toBe(10);
      item.setValue(42);
      expect(setValue).toHaveBeenCalledWith("amount", 42, { shouldDirty: true, shouldValidate: true });
    });

    it("exposes rowNum/columnName only when provided", () => {
      const { handle } = makeFormHandle();
      expect(createItemProxy(handle, "amount").rowNum).toBeUndefined();
      const cell = createItemProxy(handle, "amount", { rowNum: 3, columnName: "qty" });
      expect(cell.rowNum).toBe(3);
      expect(cell.columnName).toBe("qty");
    });

    it("throws from deferred methods", () => {
      const { handle } = makeFormHandle();
      const item = createItemProxy(handle, "amount");
      expect(() => (item.setDisabled as () => void)()).toThrow("item.setDisabled is not implemented yet");
    });
  });

  describe("createItemProxy numeric getValue coercion (classic SmartClient parity)", () => {
    const integerParam = { name: "Column1", dBColumnName: "Column1", reference: "11" } as unknown as ProcessParameter;
    const stringParam = { name: "Note", dBColumnName: "Note", reference: "10" } as unknown as ProcessParameter;
    const readNumeric = (handle: FormHandle, key: string) =>
      createItemProxy(handle, key, {}, undefined, undefined, integerParam).getValue();

    it("returns a number for a numeric parameter so comparisons are numeric, not lexicographic", () => {
      // The original bug: stored as strings, "90" < "120" is true lexicographically
      // but the migrated hook needs the numeric order 90 < 120.
      const ninety = readNumeric(makeFormHandle({ Column1: "90" }).handle, "Column1");
      const oneTwenty = readNumeric(makeFormHandle({ Column1: "120" }).handle, "Column1");
      expect(ninety).toBe(90);
      expect(oneTwenty).toBe(120);
      expect((ninety as number) < (oneTwenty as number)).toBe(true);
    });

    it("reproduces the aging-overdue validation: the four defaults compare ascending as numbers", () => {
      const { handle } = makeFormHandle({ Column1: "30", Column2: "60", Column3: "90", Column4: "120" });
      const c1 = readNumeric(handle, "Column1") as number;
      const c2 = readNumeric(handle, "Column2") as number;
      const c3 = readNumeric(handle, "Column3") as number;
      const c4 = readNumeric(handle, "Column4") as number;
      expect(c1 < c2 && c2 < c3 && c3 < c4).toBe(true);
    });

    it("leaves non-numeric parameters and empty/nullish values untouched", () => {
      const stringItem = createItemProxy(
        makeFormHandle({ Note: "90" }).handle,
        "Note",
        {},
        undefined,
        undefined,
        stringParam
      );
      expect(stringItem.getValue()).toBe("90");
      expect(readNumeric(makeFormHandle({ Column1: "" }).handle, "Column1")).toBe("");
      expect(readNumeric(makeFormHandle({ Column1: null }).handle, "Column1")).toBeNull();
    });

    it("does not coerce when no parameter metadata is supplied (backward compatible)", () => {
      expect(createItemProxy(makeFormHandle({ Column1: "90" }).handle, "Column1").getValue()).toBe("90");
    });

    it("coerces through form.getItem when the parameter is numeric", () => {
      const params = { Column1: integerParam } as unknown as Record<string, ProcessParameter>;
      const form = createFormProxy(makeFormHandle({ Column1: "90" }).handle, params);
      expect(call(form.getItem)("Column1").getValue()).toBe(90);
    });

    it("coerces through form.getItem when the map is keyed by dBColumnName and name differs", () => {
      // Real data shape: the parameters map is keyed by dBColumnName ("Column1"),
      // while parameter.name (the form key) is the long display label. getItem must
      // still find the parameter to coerce, whether addressed by columnName or name.
      const overdue = {
        name: "Number Of Days Overdue: Group Three",
        dBColumnName: "Column3",
        reference: "11",
      } as unknown as ProcessParameter;
      const params = { Column3: overdue } as unknown as Record<string, ProcessParameter>;
      const handle = makeFormHandle({ "Number Of Days Overdue: Group Three": "90" }).handle;
      const form = createFormProxy(handle, params);
      expect(call(form.getItem)("Column3").getValue()).toBe(90); // by dBColumnName (map key)
      expect(call(form.getItem)("Number Of Days Overdue: Group Three").getValue()).toBe(90); // by name
    });
  });

  describe("findParameter", () => {
    const overdue = {
      name: "Number Of Days Overdue: Group Three",
      dBColumnName: "Column3",
      reference: "11",
    } as unknown as ProcessParameter;
    const params = { Column3: overdue } as unknown as Record<string, ProcessParameter>;

    it("resolves by map key / dBColumnName and by parameter name", () => {
      expect(findParameter("Column3", params)).toBe(overdue);
      expect(findParameter("Number Of Days Overdue: Group Three", params)).toBe(overdue);
    });

    it("returns undefined for unknown names or missing parameters", () => {
      expect(findParameter("Nope", params)).toBeUndefined();
      expect(findParameter("Column3", undefined)).toBeUndefined();
    });
  });

  describe("createFormProxy", () => {
    it("resolves items by name and dBColumnName", () => {
      const { handle } = makeFormHandle({ currency: "USD" });
      const form = createFormProxy(handle, PARAMETERS);

      expect(form.getItem("currency").getValue()).toBe("USD");
      expect(form.getItem("c_currency_id").getValue()).toBe("USD");
    });

    it("getValues returns the whole value map and redraw is a no-op", () => {
      const { handle } = makeFormHandle({ a: 1 });
      const form = createFormProxy(handle, PARAMETERS);
      expect(form.getValues()).toEqual({ a: 1 });
      expect(() => form.redraw()).not.toThrow();
    });

    it("throws from deferred methods", () => {
      const { handle } = makeFormHandle();
      const form = createFormProxy(handle, PARAMETERS);
      expect(() => (form.addField as () => void)()).toThrow("form.addField is not implemented yet");
    });
  });

  describe("createGridProxy", () => {
    const state = { rows: [row("1"), row("2"), row("3")], selectedRecords: [row("2")] };

    it("exposes row count, selection and record access", () => {
      const grid = createGridProxy(state);
      expect(grid.getData().getLength()).toBe(3);
      expect(grid.getSelectedRecords()).toEqual([row("2")]);
      expect(grid.getRecord(0)).toEqual(row("1"));
      expect(grid.getRecordIndex(row("3"))).toBe(2);
      expect(grid.data.totalRows).toBe(3);
    });

    it("throws from deferred methods", () => {
      const grid = createGridProxy(state);
      expect(() => (grid.setEditValue as () => void)()).toThrow("grid.setEditValue is not implemented yet");
    });

    it("defers setRowActions and setRecordComponent without a controller", () => {
      const grid = createGridProxy(state);
      expect(() => (grid.setRowActions as () => void)()).toThrow("grid.setRowActions is not implemented yet");
      expect(() => (grid.setRecordComponent as () => void)()).toThrow("grid.setRecordComponent is not implemented yet");
    });

    it("defers show/hide when no visibility hooks are supplied", () => {
      const grid = createGridProxy(state);
      expect(() => (grid.show as () => void)()).toThrow("grid.show is not implemented yet");
      expect(() => (grid.hide as () => void)()).toThrow("grid.hide is not implemented yet");
    });

    it("wires show/hide to the supplied visibility hooks", () => {
      const visibility = { show: jest.fn(), hide: jest.fn() };
      const grid = createGridProxy(state, undefined, visibility);
      grid.show?.();
      grid.hide?.();
      expect(visibility.show).toHaveBeenCalledTimes(1);
      expect(visibility.hide).toHaveBeenCalledTimes(1);
    });

    it("delegates the new cell/column hooks to the controller (live)", () => {
      const controller = makeGridController();
      const grid = createGridProxy(state, controller);
      const recordFn = jest.fn();
      const toggleFn = jest.fn();
      const onChange = jest.fn();
      const validator = jest.fn();
      grid.onRecordChange?.(recordFn);
      grid.onSelectionToggle?.(toggleFn);
      grid.setColumnOnChange?.("quantity", onChange);
      grid.setColumnValidator?.("quantity", validator);
      expect(controller.onRecordChange).toHaveBeenCalledWith(recordFn);
      expect(controller.onSelectionToggle).toHaveBeenCalledWith(toggleFn);
      expect(controller.setColumnOnChange).toHaveBeenCalledWith("quantity", onChange);
      expect(controller.setColumnValidator).toHaveBeenCalledWith("quantity", validator);
    });

    it("defers the new cell/column hooks without a controller", () => {
      const grid = createGridProxy(state);
      expect(() => (grid.onRecordChange as () => void)()).toThrow("grid.onRecordChange is not implemented yet");
      expect(() => (grid.onSelectionToggle as () => void)()).toThrow("grid.onSelectionToggle is not implemented yet");
      expect(() => (grid.setColumnOnChange as () => void)()).toThrow("grid.setColumnOnChange is not implemented yet");
      expect(() => (grid.fireOnPause as () => void)()).toThrow("grid.fireOnPause is not implemented yet");
    });

    it("grid.fireOnPause delegates to the view debouncer, or runs immediately when none is wired", () => {
      const controller = makeGridController();
      const grid = createGridProxy(state, controller);
      const fn = jest.fn();
      // No grid.view wired yet → runs immediately (fallback).
      grid.fireOnPause?.("k", fn, 50);
      expect(fn).toHaveBeenCalledTimes(1);

      // With a view exposing fireOnPause, it delegates instead of running.
      const fireOnPause = jest.fn();
      grid.view = { fireOnPause };
      const fn2 = jest.fn();
      grid.fireOnPause?.("k", fn2, 50);
      expect(fireOnPause).toHaveBeenCalledWith("k", fn2, 50);
      expect(fn2).not.toHaveBeenCalled();
    });
  });

  describe("createViewProxy", () => {
    const messageBar: MessageBarHandle = { setMessage: jest.fn(), hide: jest.fn() };

    it("wires theForm and messageBar, and viewGrid only when a grid is given", () => {
      const { handle } = makeFormHandle({ amount: 1 });
      const noGrid = createViewProxy(handle, PARAMETERS, { messageBar });
      expect(noGrid.theForm.getItem("amount").getValue()).toBe(1);
      noGrid.messageBar.setMessage("warning", null, "hi");
      expect(messageBar.setMessage).toHaveBeenCalledWith("warning", null, "hi");
      expect(noGrid.viewGrid).toBeUndefined();

      const grid = createGridProxy({ rows: [row("1")], selectedRecords: [] });
      const withGrid = createViewProxy(handle, PARAMETERS, { messageBar, grid });
      expect(withGrid.viewGrid).toBe(grid);
    });

    it("throws from action methods when no viewController is given", () => {
      const { handle } = makeFormHandle();
      const view = createViewProxy(handle, PARAMETERS, { messageBar });
      expect(() => (view.refresh as () => void)()).toThrow("view.refresh is not implemented yet");
      expect(() => (view.selectAllRecords as () => void)()).toThrow("view.selectAllRecords is not implemented yet");
    });

    it("exposes read-only environment data and the context accessors regardless of controller", () => {
      const { handle } = makeFormHandle({ amount: 7 });
      const data: ViewData = {
        windowId: "W-1",
        callerField: { id: "F-1", name: "MyButton", columnId: "C-1", record: row("rec-1") },
        activeTabId: "T-1",
        parentRecord: { docStatus: "DR", amount: 1 },
      };
      const view = createViewProxy(handle, PARAMETERS, { messageBar, data });

      expect(view.windowId).toBe("W-1");
      expect(view.callerField?.record).toEqual(row("rec-1"));
      expect(view.activeView?.tabId).toBe("T-1");
      // Context = the launching tab id + parent record overlaid with the live parameter values.
      expect(view.getContextInfo()).toEqual({ inpTabId: "T-1", docStatus: "DR", amount: 7 });
      // getView returns this view for the active tab, a minimal handle otherwise.
      expect(view.getView("T-1")).toBe(view);
      expect(view.getView("OTHER")).toEqual({ tabId: "OTHER" });
    });

    it("exposes the classic view.parentWindow.view context handle, preserving parentWindow data", () => {
      const { handle } = makeFormHandle({ amount: 7 });
      const data: ViewData = {
        activeTabId: "T-1",
        parentWindow: { tabTitle: "Business Partner" },
        parentRecord: { docStatus: "DR", amount: 1 },
      };
      const view = createViewProxy(handle, PARAMETERS, { messageBar, data });
      const parentWindow = view.parentWindow as { tabTitle: string; view: ViewProxy };

      // Classic idiom `view.parentWindow.view.getContextInfo()` resolves to the same context.
      expect(parentWindow.view.getContextInfo()).toEqual(view.getContextInfo());
      expect(parentWindow.view.getContextInfo()).toEqual({ inpTabId: "T-1", docStatus: "DR", amount: 7 });
      expect(parentWindow.view.getView("T-1")).toBe(view);
      // The original parentWindow data is preserved alongside the injected `view` handle.
      expect(parentWindow.tabTitle).toBe("Business Partner");
    });

    it("falls back to a bare { view } parentWindow when none is provided", () => {
      const { handle } = makeFormHandle({ amount: 7 });
      const view = createViewProxy(handle, PARAMETERS, {
        messageBar,
        data: { parentRecord: { docStatus: "CO" } },
      });
      const parentWindow = view.parentWindow as { view: ViewProxy };

      expect(parentWindow.view.getContextInfo()).toEqual({ docStatus: "CO", amount: 7 });
    });

    it("exposes the classic two-tier parentWindow.activeView[.parentView].getContextInfo fallback", () => {
      const { handle } = makeFormHandle({ amount: 7 });
      const data: ViewData = { activeTabId: "T-9", parentRecord: { docStatus: "DR" } };
      const view = createViewProxy(handle, PARAMETERS, { messageBar, data });
      const parentWindow = view.parentWindow as {
        activeView: { getContextInfo: () => Record<string, unknown>; parentView: { getContextInfo: () => Record<string, unknown> } };
      };

      const expected = { inpTabId: "T-9", docStatus: "DR", amount: 7 };
      expect(parentWindow.activeView.getContextInfo()).toEqual(expected);
      expect(parentWindow.activeView.parentView.getContextInfo()).toEqual(expected);
    });

    it("exposes an always-live view.openDynamicForm regardless of controller", () => {
      const { handle } = makeFormHandle();
      const view = createViewProxy(handle, PARAMETERS, { messageBar });
      expect(typeof view.openDynamicForm).toBe("function");
    });

    it("delegates the action methods to the viewController", () => {
      const { handle } = makeFormHandle();
      const viewController = makeViewController();
      const view = createViewProxy(handle, PARAMETERS, { messageBar, viewController });

      (view.refresh as (f?: boolean, k?: boolean) => void)(true, false);
      (view.fireOnPause as (id: string, fn: () => void, d: number) => void)("id", () => {}, 50);
      (view.handleReadOnlyLogic as () => void)();
      (view.handleButtonsStatus as () => void)();
      (view.selectAllRecords as () => void)();
      (view.getSelection as () => EntityData[])();

      expect(viewController.refresh).toHaveBeenCalledWith(true, false);
      expect(viewController.fireOnPause).toHaveBeenCalledWith("id", expect.any(Function), 50);
      expect(viewController.handleReadOnlyLogic).toHaveBeenCalled();
      expect(viewController.handleButtonsStatus).toHaveBeenCalled();
      expect(viewController.selectAllRecords).toHaveBeenCalled();
      expect(viewController.getSelection).toHaveBeenCalled();
    });

    it("wires the footer chrome to the viewController", () => {
      const { handle } = makeFormHandle();
      const doneButton: FooterButtonHandle = {
        _buttonValue: "DONE",
        title: "Done",
        hide: jest.fn(),
        show: jest.fn(),
        setDisabled: jest.fn(),
      };
      const viewController = makeViewController([doneButton]);
      const view = createViewProxy(handle, PARAMETERS, { messageBar, viewController });

      expect(view.popupButtons?.members).toEqual([doneButton]);
      view.popupButtons?.members.find((b) => b._buttonValue === "DONE")?.hide();
      expect(doneButton.hide).toHaveBeenCalled();

      view.cancelButton?.hide();
      expect(viewController.setCancelHidden).toHaveBeenCalledWith(true);
      view.parentElement?.parentElement.closeButton.hide();
      expect(viewController.setCloseHidden).toHaveBeenCalledWith(true);
    });

    it("makes view.okButton live with a controller (isEnabled / enable delegate)", () => {
      const { handle } = makeFormHandle();
      const viewController = makeViewController();
      (viewController.isOkButtonEnabled as jest.Mock).mockReturnValue(true);
      const view = createViewProxy(handle, PARAMETERS, { messageBar, viewController });

      expect(view.okButton?.isEnabled()).toBe(true);
      view.okButton?.enable();
      expect(viewController.enableOkButton).toHaveBeenCalledTimes(1);
    });

    it("defers view.okButton methods without a controller", () => {
      const { handle } = makeFormHandle();
      const view = createViewProxy(handle, PARAMETERS, { messageBar });
      expect(() => view.okButton?.isEnabled()).toThrow("view.okButton.isEnabled is not implemented yet");
      expect(() => view.okButton?.enable()).toThrow("view.okButton.enable is not implemented yet");
    });

    it("defers openProcess and exposes no standardWindow alias without a controller", () => {
      const { handle } = makeFormHandle();
      const view = createViewProxy(handle, PARAMETERS, { messageBar });
      expect(() => (view.openProcess as () => void)()).toThrow("view.openProcess is not implemented yet");
      expect(view.standardWindow).toBeUndefined();
    });

    it("makes openProcess live with a controller and delegates it (incl. the standardWindow alias)", () => {
      const { handle } = makeFormHandle();
      const viewController = makeViewController();
      const view = createViewProxy(handle, PARAMETERS, { messageBar, viewController });

      view.openProcess?.(OPEN_PROCESS_PARAMS);
      view.standardWindow?.openProcess(OPEN_PROCESS_PARAMS);

      expect(viewController.openProcess).toHaveBeenCalledTimes(2);
      expect(viewController.openProcess).toHaveBeenNthCalledWith(1, OPEN_PROCESS_PARAMS);
      expect(viewController.openProcess).toHaveBeenNthCalledWith(2, OPEN_PROCESS_PARAMS);
    });

    it("defers executeProcess when no executor is injected", () => {
      const { handle } = makeFormHandle();
      const view = createViewProxy(handle, PARAMETERS, { messageBar });
      expect(() => (view.executeProcess as () => void)()).toThrow("view.executeProcess is not implemented yet");
    });

    it("exposes executeProcess when its executor is injected", async () => {
      const { handle } = makeFormHandle();
      const executeProcess = jest.fn(async () => ({ message: { severity: "success", text: "ok" } }));
      const view = createViewProxy(handle, PARAMETERS, { messageBar, executeProcess });

      const response = await (view.executeProcess as (a?: string) => Promise<unknown>)("DONE");
      expect(executeProcess).toHaveBeenCalledWith("DONE");
      expect(response).toEqual({ message: { severity: "success", text: "ok" } });
    });

    it("merges hookData onto the view without shadowing the canonical surface", () => {
      const { handle } = makeFormHandle();
      const view = createViewProxy(handle, PARAMETERS, {
        messageBar,
        viewController: makeViewController(),
        data: { windowId: "W-9" },
        hookData: { selectedRecords: [row("a")], recordIds: ["a"], windowId: "ignored" },
      });
      // Legacy data fields are reachable directly off the view (arg2 = view).
      expect(view.selectedRecords).toEqual([row("a")]);
      expect(view.recordIds).toEqual(["a"]);
      // The canonical surface wins over any colliding hookData key.
      expect(view.windowId).toBe("W-9");
      expect(typeof view.refresh).toBe("function");
    });
  });

  describe("onGridLoad integration", () => {
    it("runs a compiled onGridLoad body against the grid/view proxies", () => {
      const messageBar: MessageBarHandle = { setMessage: jest.fn(), hide: jest.fn() };
      const { handle } = makeFormHandle({ amount: 5 });

      // Mirrors the classic productCharacteristics onGridLoad: warn when empty.
      const body = `(grid, view, parameters) => {
        if (grid.getData().getLength() === 0) {
          view.messageBar.setMessage('info', null, 'NoVariants');
        }
      }`;
      const hook = compileParameterHook(body, {});
      expect(hook).not.toBeNull();

      const emptyGrid = createGridProxy({ rows: [], selectedRecords: [] });
      const emptyView = createViewProxy(handle, PARAMETERS, { messageBar, grid: emptyGrid });
      hook?.(emptyGrid, emptyView, PARAMETERS);
      expect(messageBar.setMessage).toHaveBeenCalledWith("info", null, "NoVariants");

      (messageBar.setMessage as jest.Mock).mockClear();
      const fullGrid = createGridProxy({ rows: [row("1")], selectedRecords: [] });
      const fullView = createViewProxy(handle, PARAMETERS, { messageBar, grid: fullGrid });
      hook?.(fullGrid, fullView, PARAMETERS);
      expect(messageBar.setMessage).not.toHaveBeenCalled();
    });
  });

  describe("createItemProxy with a FieldController", () => {
    it("delegates the visibility / state mutations to the controller", () => {
      const controller = makeController();
      const { handle } = makeFormHandle({ amount: 1 });
      const item = createItemProxy(handle, "amount", {}, controller);

      call(item.setRequired)();
      call(item.setRequired)(false);
      call(item.setDisabled)();
      call(item.show)();
      call(item.hide)();

      expect(controller.setRequired).toHaveBeenNthCalledWith(1, "amount", true);
      expect(controller.setRequired).toHaveBeenNthCalledWith(2, "amount", false);
      expect(controller.setDisabled).toHaveBeenCalledWith("amount", true);
      expect(controller.setDisplayed).toHaveBeenNthCalledWith(1, "amount", true);
      expect(controller.setDisplayed).toHaveBeenNthCalledWith(2, "amount", false);
    });

    it("routes setValueMap / getValueMap through the controller", () => {
      const options: ListOption[] = [{ id: "a", value: "a", label: "A" }];
      const controller = makeController({ amount: options });
      const { handle } = makeFormHandle();
      const item = createItemProxy(handle, "amount", {}, controller);

      call(item.setValueMap)({ a: "A" });
      expect(controller.setValueMap).toHaveBeenCalledWith("amount", { a: "A" });
      expect(call(item.getValueMap)()).toEqual(options);
    });

    it("setValueProgrammatically sets the value and selects the matching option label", () => {
      const entry: ListOption = { id: "CO", value: "CO", label: "Book" };
      const controller = makeController();
      const { handle, setValue } = makeFormHandle({ amount$_entries: [entry] });
      const item = createItemProxy(handle, "amount", {}, controller);

      call(item.setValueProgrammatically)("CO");
      expect(setValue).toHaveBeenCalledWith("amount", "CO", { shouldDirty: true, shouldValidate: true });
      expect(setValue).toHaveBeenCalledWith("amount$_identifier", "Book", { shouldDirty: true, shouldValidate: true });
    });

    it("getFirstOptionValue returns the first option value, from entries or the controller", () => {
      const entries: ListOption[] = [
        { id: "CO", value: "CO", label: "Book" },
        { id: "VO", value: "VO", label: "Void" },
      ];
      const fromEntries = createItemProxy(
        makeFormHandle({ amount$_entries: entries }).handle,
        "amount",
        {},
        makeController()
      );
      expect(call(fromEntries.getFirstOptionValue)()).toBe("CO");

      const fromController = createItemProxy(
        makeFormHandle().handle,
        "amount",
        {},
        makeController({ amount: entries })
      );
      expect(call(fromController.getFirstOptionValue)()).toBe("CO");
    });

    it("getFirstOptionValue returns undefined when the selector has no options", () => {
      const item = createItemProxy(makeFormHandle().handle, "amount", {}, makeController());
      expect(call(item.getFirstOptionValue)()).toBeUndefined();
    });

    it("defers setValueProgrammatically / getFirstOptionValue without a controller", () => {
      const item = createItemProxy(makeFormHandle().handle, "amount");
      expect(() => call(item.setValueProgrammatically)("CO")).toThrow(
        "item.setValueProgrammatically is not implemented yet"
      );
      expect(() => call(item.getFirstOptionValue)()).toThrow("item.getFirstOptionValue is not implemented yet");
    });

    it("clears the value and sets a value from a record via the form handle", () => {
      const controller = makeController();
      const { handle, setValue } = makeFormHandle({ amount: 5 });
      const item = createItemProxy(handle, "amount", {}, controller);

      call(item.clearValue)();
      expect(setValue).toHaveBeenCalledWith("amount", null, { shouldDirty: true, shouldValidate: true });

      call(item.setValueFromRecord)({ id: "X", _identifier: "Label X" });
      expect(setValue).toHaveBeenCalledWith("amount", "X", { shouldValidate: true, shouldDirty: true });
      expect(setValue).toHaveBeenCalledWith("amount_data", { id: "X", _identifier: "Label X" });
      expect(setValue).toHaveBeenCalledWith("amount$_identifier", "Label X", {
        shouldValidate: true,
        shouldDirty: true,
      });
    });

    it("keeps grid-owned methods deferred even with a controller", () => {
      const controller = makeController();
      const { handle } = makeFormHandle();
      const item = createItemProxy(handle, "amount", {}, controller);

      expect(() => call(item.fetchData)()).toThrow("item.fetchData is not implemented yet");
      expect(() => call(item.getElementValue)()).toThrow("item.getElementValue is not implemented yet");
    });
  });

  describe("createFormProxy with a FieldController", () => {
    it("hides an item by dBColumnName and exposes mutable items", () => {
      const controller = makeController();
      const { handle } = makeFormHandle({ currency: "USD" });
      const form = createFormProxy(handle, PARAMETERS, controller);

      call(form.hideItem)("c_currency_id");
      expect(controller.setDisplayed).toHaveBeenCalledWith("currency", false);

      call(call(form.getItem)("currency").setRequired)(false);
      expect(controller.setRequired).toHaveBeenCalledWith("currency", false);
    });

    it("exposes getFields / getField / values and structural mutations", () => {
      const controller = makeController();
      const { handle } = makeFormHandle({ amount: 1, currency: "USD" });
      const form = createFormProxy(handle, PARAMETERS, controller);

      const fields = call(form.getFields)() as Array<{ name: string }>;
      expect(fields.map((f) => f.name)).toEqual(["amount", "currency"]);
      expect((call(form.getField)(0) as { name: string }).name).toBe("amount");
      expect(form.values).toEqual({ amount: 1, currency: "USD" });

      const field = { name: "extra", reference: "10" };
      call(form.addField)(field);
      expect(controller.addField).toHaveBeenCalledWith(field);

      call(form.removeField)(1);
      expect(controller.removeField).toHaveBeenCalledWith(1);

      call(form.focusInItem)("amount");
      expect(controller.focusField).toHaveBeenCalledWith("amount");
    });
  });

  describe("createGridProxy with a GridController", () => {
    it("serves read accessors live from the controller", () => {
      const rows = [row("1"), row("2")];
      const controller = makeGridController({
        getRows: jest.fn(() => rows),
        getSelectedRecords: jest.fn(() => [row("2")]),
        getTotalRows: jest.fn(() => rows.length),
        getRecord: jest.fn((i: number) => rows[i]),
        getRecordIndex: jest.fn(() => 1),
        getEditedCell: jest.fn(() => 42),
      });
      const grid = createGridProxy({ rows: [], selectedRecords: [] }, controller);

      expect(grid.getData().getLength()).toBe(2);
      expect(grid.getSelectedRecords()).toEqual([row("2")]);
      expect(grid.getRecord(0)).toEqual(row("1"));
      expect((grid.getRecordIndex as (r: EntityData) => number)(row("2"))).toBe(1);
      expect(grid.data.totalRows).toBe(2);
      expect(grid.data.localData).toEqual(rows);
      expect((grid.getEditedCell as (i: number, c: string) => unknown)(0, "amount")).toBe(42);
    });

    it("delegates the live mutation/lifecycle methods to the controller", () => {
      const controller = makeGridController();
      const grid = createGridProxy({ rows: [], selectedRecords: [] }, controller);

      call(grid.setEditValue)(0, "amount", 10);
      expect(controller.setEditValue).toHaveBeenCalledWith(0, "amount", 10);
      call(grid.selectRecord)(1);
      expect(controller.selectRecord).toHaveBeenCalledWith(1);
      call(grid.deselectRecord)(2);
      expect(controller.deselectRecord).toHaveBeenCalledWith(2);
      call(grid.invalidateCache)();
      expect(controller.invalidateCache).toHaveBeenCalled();
      call(grid.fetchData)({ any: true });
      expect(controller.fetchData).toHaveBeenCalledWith({ any: true });
      call(grid.getCriteria)();
      expect(controller.getCriteria).toHaveBeenCalled();
      call(grid.addSelectedIDsToCriteria)({ operator: "and" }, false);
      expect(controller.addSelectedIDsToCriteria).toHaveBeenCalledWith({ operator: "and" }, false);
      call(grid.getFieldByColumnName)("amount_col");
      expect(controller.getFieldByColumnName).toHaveBeenCalledWith("amount_col");
    });

    it("routes the chained lifecycle callbacks to the controller sinks", () => {
      const controller = makeGridController();
      const grid = createGridProxy({ rows: [], selectedRecords: [] }, controller);
      const onArrived = jest.fn();
      const onSelected = jest.fn();

      (grid as Record<string, unknown>).dataArrived = onArrived;
      (grid as Record<string, unknown>).selectionChanged = onSelected;

      expect(controller.onDataArrived).toHaveBeenCalledWith(onArrived);
      expect(controller.onSelectionChanged).toHaveBeenCalledWith(onSelected);
      // The property reads back the last assigned function (classic chaining).
      expect((grid as Record<string, unknown>).dataArrived).toBe(onArrived);
    });

    it("keeps the filter-editor methods deferred even with a controller", () => {
      const grid = createGridProxy({ rows: [], selectedRecords: [] }, makeGridController());
      expect(() => (grid.filterByEditor as () => void)()).toThrow("grid.filterByEditor is not implemented yet");
      expect(() => (grid.setFilterEditorCriteria as () => void)()).toThrow(
        "grid.setFilterEditorCriteria is not implemented yet"
      );
    });

    it("delegates setRowActions and its setRecordComponent alias to the controller", () => {
      const controller = makeGridController();
      const grid = createGridProxy({ rows: [], selectedRecords: [] }, controller);
      const renderer = jest.fn();

      call(grid.setRowActions)(renderer);
      call(grid.setRecordComponent)(renderer);

      expect(controller.setRowActions).toHaveBeenCalledTimes(2);
      expect(controller.setRowActions).toHaveBeenNthCalledWith(1, renderer);
      expect(controller.setRowActions).toHaveBeenNthCalledWith(2, renderer);
    });
  });

  describe("item.canvas / gridResolver", () => {
    it("exposes a live viewGrid when the resolver returns a controller", () => {
      const { handle } = makeFormHandle();
      const controller = makeGridController();
      const resolver: GridResolver = jest.fn(() => controller);
      const item = createItemProxy(handle, "amount", {}, undefined, resolver);

      expect(resolver).toHaveBeenCalledWith("amount");
      const viewGrid = item.canvas?.viewGrid;
      call(viewGrid?.setEditValue)(0, "amount", 5);
      expect(controller.setEditValue).toHaveBeenCalledWith(0, "amount", 5);
      expect(() => item.canvas?.markForRedraw()).not.toThrow();
    });

    it("toggles the grid parameter via canvas.viewGrid.show()/hide() when a FieldController is present", () => {
      const { handle } = makeFormHandle();
      const fieldController = makeController();
      const gridController = makeGridController();
      const resolver: GridResolver = jest.fn(() => gridController);
      const item = createItemProxy(handle, "Accounts", {}, fieldController, resolver);

      const viewGrid = item.canvas?.viewGrid;
      viewGrid?.hide?.();
      viewGrid?.show?.();
      expect(fieldController.setDisplayed).toHaveBeenNthCalledWith(1, "Accounts", false);
      expect(fieldController.setDisplayed).toHaveBeenNthCalledWith(2, "Accounts", true);
    });

    it("defers viewGrid show/hide when no FieldController is present", () => {
      const { handle } = makeFormHandle();
      const resolver: GridResolver = jest.fn(() => makeGridController());
      const item = createItemProxy(handle, "Accounts", {}, undefined, resolver);
      expect(() => (item.canvas?.viewGrid?.hide as () => void)()).toThrow("grid.hide is not implemented yet");
    });

    it("defers viewGrid methods when the parameter has no registered grid", () => {
      const { handle } = makeFormHandle();
      const resolver: GridResolver = jest.fn(() => undefined);
      const item = createItemProxy(handle, "amount", {}, undefined, resolver);
      expect(() => (item.canvas?.viewGrid?.setEditValue as () => void)()).toThrow(
        "grid.setEditValue is not implemented yet"
      );
    });

    it("throws on canvas access when no resolver is injected (back-compat)", () => {
      const { handle } = makeFormHandle();
      const item = createItemProxy(handle, "amount");
      expect(() => item.canvas).toThrow("item.canvas is not implemented yet");
    });

    it("reaches the grid through view.theForm.getItem(...).canvas.viewGrid", () => {
      const { handle } = makeFormHandle({ amount: 1 });
      const messageBar: MessageBarHandle = { setMessage: jest.fn(), hide: jest.fn() };
      const controller = makeGridController({ getSelectedRecords: jest.fn(() => [row("9")]) });
      const resolver: GridResolver = jest.fn(() => controller);
      const view = createViewProxy(handle, PARAMETERS, { messageBar, gridResolver: resolver });

      const viewGrid = view.theForm.getItem("amount").canvas?.viewGrid;
      expect(viewGrid?.getSelectedRecords()).toEqual([row("9")]);
    });
  });

  describe("buildGridVisibility", () => {
    it("maps show -> setDisplayed(name, true) and hide -> setDisplayed(name, false)", () => {
      const controller = makeController();
      const visibility = buildGridVisibility(controller, "Accounts");

      visibility.show();
      visibility.hide();
      expect(controller.setDisplayed).toHaveBeenNthCalledWith(1, "Accounts", true);
      expect(controller.setDisplayed).toHaveBeenNthCalledWith(2, "Accounts", false);
    });
  });

  describe("normalizeValueMapEntries", () => {
    it("normalizes an array of { id, value, label } entries", () => {
      const map = [{ id: "100", value: "100", label: "USD" }];
      expect(normalizeValueMapEntries(map)).toEqual([{ id: "100", value: "100", label: "USD" }]);
    });

    it("normalizes an id -> label object map", () => {
      expect(normalizeValueMapEntries({ "100": "USD", "200": "EUR" })).toEqual([
        { id: "100", value: "100", label: "USD" },
        { id: "200", value: "200", label: "EUR" },
      ]);
    });

    it("derives id from value and label from title/text, and drops entries without an id", () => {
      const map = [{ value: "100", title: "USD" }, { text: "no id" }, null];
      expect(normalizeValueMapEntries(map)).toEqual([{ id: "100", value: "100", label: "USD" }]);
    });

    it("returns [] for non-map inputs", () => {
      expect(normalizeValueMapEntries(undefined)).toEqual([]);
      expect(normalizeValueMapEntries("x")).toEqual([]);
    });
  });

  describe("selector value-map bridge", () => {
    const USD_ENTRY: ListOption = { id: "100", value: "100", label: "USD" };
    const ENTRIES_KEY = "currency$_entries";
    const IDENTIFIER_KEY = "currency$_identifier";

    it("setValueMap sets $_identifier for the current value without overriding the datasource dropdown", () => {
      const controller = makeController();
      const { handle, values } = makeFormHandle({ currency: "100" });
      const item = createItemProxy(handle, "currency", {}, controller);

      call(item.setValueMap)([USD_ENTRY]);

      expect(values[IDENTIFIER_KEY]).toBe("USD");
      // The dropdown stays datasource-driven: the map is NOT injected as options.
      expect(values).not.toHaveProperty(ENTRIES_KEY);
      expect(controller.setValueMap).toHaveBeenCalledWith("currency", [USD_ENTRY]);
    });

    it("setValue syncs $_identifier when the injected entries contain the value", () => {
      const controller = makeController();
      const { handle, values } = makeFormHandle({ [ENTRIES_KEY]: [USD_ENTRY] });
      const item = createItemProxy(handle, "currency", {}, controller);

      call(item.setValue)("100");

      expect(values.currency).toBe("100");
      expect(values[IDENTIFIER_KEY]).toBe("USD");
    });

    it("setValue does not write an identifier for a field without entries", () => {
      const { handle, values } = makeFormHandle({ amount: 1 });
      const item = createItemProxy(handle, "amount");

      call(item.setValue)(42);

      expect(values.amount).toBe(42);
      expect(values).not.toHaveProperty("amount$_identifier");
    });

    it("getValueMap reads injected $_entries when present, preserving .value for the classic filter", () => {
      const controller = makeController();
      const { handle } = makeFormHandle({ [ENTRIES_KEY]: [USD_ENTRY] });
      const item = createItemProxy(handle, "currency", {}, controller);

      const stored = call(item.getValueMap)() as ListOption[];

      expect(stored).toEqual([USD_ENTRY]);
      expect(stored.filter((option) => option.value !== "100")).toEqual([]);
    });

    it("getValueMap falls back to the controller when no entries are injected", () => {
      const options: ListOption[] = [{ id: "a", value: "a", label: "A" }];
      const controller = makeController({ currency: options });
      const { handle } = makeFormHandle();
      const item = createItemProxy(handle, "currency", {}, controller);

      expect(call(item.getValueMap)()).toEqual(options);
    });
  });
});
