import type { UseFormReturn } from "react-hook-form";
import type { EntityData, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import {
  createFormHandle,
  createFormProxy,
  createGridProxy,
  createItemProxy,
  createViewProxy,
  notImplemented,
  resolveFormKey,
  type FormHandle,
  type MessageBarHandle,
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

    it("throws from deferred methods", () => {
      const { handle } = makeFormHandle();
      const view = createViewProxy(handle, PARAMETERS, { messageBar });
      expect(() => (view.refresh as () => void)()).toThrow("view.refresh is not implemented yet");
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
});
