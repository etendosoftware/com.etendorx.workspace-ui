import {
  convertDatasourceValue,
  normalizeContextKey,
  resolveContextValue,
  applyMergedParam,
  buildFilterCriteriaEntry,
  applyGridSelection,
  buildProcessScriptContext,
  injectDynamicParameters,
  applyStaticParameterValues,
  updateParametersFromOnLoadResult,
  withFlag,
  withMandatory,
  withRefList,
  normalizeValueMap,
  addDynamicParameter,
  removeParameter,
  withButtonHidden,
  withButtonDisabled,
  withButtonAction,
  runFooterButtonAction,
  makeFooterButtonHandle,
  withCancelHidden,
  withCloseHidden,
  withOkForceEnabled,
  EMPTY_SCRIPT_BUTTON_STATE,
  addSelectedIDsToCriteria,
  type ScriptButtonState,
  type DynamicParameter,
  type ParametersMap,
} from "../utils";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

describe("Process Definition Utils", () => {
  describe("convertDatasourceValue", () => {
    it("should convert 'Y' to true", () => {
      expect(convertDatasourceValue("Y")).toBe(true);
    });

    it("should convert 'N' to false", () => {
      expect(convertDatasourceValue("N")).toBe(false);
    });

    it("should convert numeric strings to numbers", () => {
      expect(convertDatasourceValue("123")).toBe(123);
      expect(convertDatasourceValue("45.67")).toBe(45.67);
    });

    it("should keep long strings as strings (e.g. UUIDs)", () => {
      const uuid = "40449D6B3C094B15AC74A7E09F6E84C4";
      expect(convertDatasourceValue(uuid)).toBe(uuid);
    });

    it("should return original value for non-matching types", () => {
      const obj = { foo: "bar" };
      expect(convertDatasourceValue(obj)).toBe(obj);
      expect(convertDatasourceValue("")).toBe("");
    });
  });

  describe("normalizeContextKey", () => {
    it("should strip @ symbols from both ends", () => {
      expect(normalizeContextKey("@AD_Org_ID@")).toBe("AD_Org_ID");
    });

    it("should return original key if no @ symbols", () => {
      expect(normalizeContextKey("AD_Org_ID")).toBe("AD_Org_ID");
    });

    it("should return original key it doesn't match both ends", () => {
      expect(normalizeContextKey("@AD_Org_ID")).toBe("@AD_Org_ID");
    });
  });

  describe("resolveContextValue", () => {
    it("should find bare key in record", () => {
      const record = { foo: "bar" };
      expect(resolveContextValue("foo", record)).toBe("bar");
    });

    it("should find inp-prefixed key in record", () => {
      const record = { inpfoo: "bar" };
      expect(resolveContextValue("foo", record)).toBe("bar");
    });

    it("should prioritize bare key over inp-prefixed key", () => {
      const record = { foo: "direct", inpfoo: "prefixed" };
      expect(resolveContextValue("foo", record)).toBe("direct");
    });
  });

  describe("applyMergedParam", () => {
    it("should map system keys like inpadOrgId", () => {
      const options: any = {};
      applyMergedParam("inpadOrgId", "456", {}, options);
      expect(options.ad_org_id).toBe("456");
    });

    it("should use parameter's dBColumnName if matched", () => {
      const parameters: any = {
        p1: { name: "Param1", dBColumnName: "db_p1" },
      };
      const options: any = {};
      applyMergedParam("Param1", "val1", parameters, options);
      expect(options.db_p1).toBe("val1");
    });
  });

  describe("buildFilterCriteriaEntry", () => {
    it("should build boolean criteria for 'true'/'false' strings", () => {
      expect(buildFilterCriteriaEntry("field", "true")).toEqual({
        fieldName: "field",
        operator: "equals",
        value: true,
      });
      expect(buildFilterCriteriaEntry("field", "false")).toEqual({
        fieldName: "field",
        operator: "equals",
        value: false,
      });
    });

    it("should use 'equals' and UUID value for UUID-like strings", () => {
      const uuid = "40449D6B3C094B15AC74A7E09F6E84C4";
      expect(buildFilterCriteriaEntry("field", uuid)).toEqual({
        fieldName: "field",
        operator: "equals",
        value: uuid,
      });
    });

    it("should use 'iContains' for other strings", () => {
      expect(buildFilterCriteriaEntry("field", "some text")).toEqual({
        fieldName: "field",
        operator: "iContains",
        value: "some text",
      });
    });

    it("should default to 'equals' for non-string values", () => {
      expect(buildFilterCriteriaEntry("field", 123)).toEqual({
        fieldName: "field",
        operator: "equals",
        value: 123,
      });
    });
  });

  describe("applyGridSelection", () => {
    it("should convert ID arrays to EntityData objects", () => {
      const prev = {};
      const mapping = { grid1: ["id1", "id2"] };
      const result = applyGridSelection(prev, mapping);

      expect(result.grid1._selection).toHaveLength(2);
      expect(result.grid1._selection[0]).toEqual({ id: "id1" });
      expect(result.grid1._selection[1]).toEqual({ id: "id2" });
    });

    it("should preserve allRows if grid already exists", () => {
      const prev: any = { grid1: { _selection: [], _allRows: [{ id: "row1" }] } };
      const mapping = { grid1: ["id1"] };
      const result = applyGridSelection(prev, mapping);

      expect(result.grid1._allRows).toEqual([{ id: "row1" }]);
    });

    it("should handle non-array ids by returning empty selection", () => {
      const prev = {};
      const mapping = { grid1: "not-an-array" as any };
      const result = applyGridSelection(prev, mapping);
      expect(result.grid1._selection).toEqual([]);
    });
  });

  describe("buildProcessScriptContext", () => {
    const credentials = {
      token: "test-token",
      getCsrfToken: () => "csrf-123",
    };

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return an object with callAction, callDatasource, callServlet", () => {
      const ctx = buildProcessScriptContext(credentials);
      expect(ctx.callAction).toBeInstanceOf(Function);
      expect(ctx.callDatasource).toBeInstanceOf(Function);
      expect(ctx.callServlet).toBeInstanceOf(Function);
    });

    it("should expose the shared OB shim", () => {
      const ctx = buildProcessScriptContext(credentials);
      expect(ctx.OB.PropertyStore).toBeDefined();
      expect(typeof ctx.OB.I18N.getLabel).toBe("function");
    });

    it("callAction should POST to kernel endpoint with auth headers", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ result: "ok" }),
      });

      const ctx = buildProcessScriptContext(credentials);
      const result = await ctx.callAction("com.example.Handler", { key: "val" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/erp/org.openbravo.client.kernel?_action=com.example.Handler"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            "X-CSRF-Token": "csrf-123",
          }),
        })
      );
      expect(result).toEqual({ data: { result: "ok" } });
    });

    it("callAction should append queryParams to URL", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const ctx = buildProcessScriptContext(credentials);
      await ctx.callAction("com.example.Handler", {}, { queryParams: { foo: "bar" } });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain("&foo=bar");
    });

    it("OB.RemoteCallManager.call should route through callAction and invoke the callback", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ message: { severity: "success" } }),
      });
      const callback = jest.fn();

      const ctx = buildProcessScriptContext(credentials);
      ctx.OB.RemoteCallManager.call("com.example.Handler", { a: 1 }, {}, callback);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/erp/org.openbravo.client.kernel?_action=com.example.Handler"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            "X-CSRF-Token": "csrf-123",
          }),
        })
      );
      expect(callback).toHaveBeenCalledWith(
        { status: 0 },
        { message: { severity: "success" } },
        { clientContext: undefined }
      );
    });

    it("OB.RemoteCallManager.call should report a transport failure as a negative status", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => "Server Error",
      });
      const callback = jest.fn();

      const ctx = buildProcessScriptContext(credentials);
      ctx.OB.RemoteCallManager.call("com.example.Handler", {}, {}, callback);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith({ status: -1 }, null, { clientContext: undefined });
    });

    it("callDatasource should POST to datasource endpoint", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ rows: [] }),
      });

      const ctx = buildProcessScriptContext(credentials);
      const result = await ctx.callDatasource("MyEntity");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/datasource/MyEntity"),
        expect.objectContaining({ method: "POST" })
      );
      expect(result).toEqual({ data: { rows: [] } });
    });

    it("callDatasource should append queryParams", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const ctx = buildProcessScriptContext(credentials);
      await ctx.callDatasource("Entity", {}, { queryParams: { _startRow: "0" } });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain("_startRow=0");
    });

    it("OB.Datasource.create(...).fetchData should route through the api-client datasource", async () => {
      const rows = [{ id: 1 }];
      const getSpy = jest
        .spyOn(datasource, "get")
        .mockResolvedValue({ data: { response: { status: 0, data: rows, totalRows: 1 } } });
      const callback = jest.fn();

      const ctx = buildProcessScriptContext(credentials);
      ctx.OB.Datasource.create({ dataURL: "/openbravo/org.openbravo.service.datasource/MyEntity" }).fetchData(
        {},
        callback
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(getSpy).toHaveBeenCalledWith("MyEntity", expect.objectContaining({ _operationType: "fetch" }));
      expect(callback).toHaveBeenCalledWith({ status: 0, totalRows: 1 }, rows, { criteria: {} });

      getSpy.mockRestore();
    });

    it("OB.Datasource.create(...).fetchData should report a transport failure as a negative status", async () => {
      const getSpy = jest.spyOn(datasource, "get").mockRejectedValue(new Error("Server Error"));
      const callback = jest.fn();

      const ctx = buildProcessScriptContext(credentials);
      ctx.OB.Datasource.create({ dataURL: "/a/b/MyEntity" }).fetchData({}, callback);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith({ status: -1, totalRows: 0 }, [], { criteria: {} });

      getSpy.mockRestore();
    });

    it("callServlet should POST to given path", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ done: true }),
      });

      const ctx = buildProcessScriptContext(credentials);
      const result = await ctx.callServlet("/my/servlet", { key: "val" });

      expect(global.fetch).toHaveBeenCalledWith("/my/servlet", expect.objectContaining({ method: "POST" }));
      expect(result).toEqual({ data: { done: true } });
    });

    it("callServlet with GET should not include body", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const ctx = buildProcessScriptContext(credentials);
      await ctx.callServlet("/path", {}, { method: "GET" });

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.method).toBe("GET");
      expect(fetchOptions.body).toBeUndefined();
    });

    it("callServlet with extra headers should merge them", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const ctx = buildProcessScriptContext(credentials);
      await ctx.callServlet("/path", {}, { headers: { "X-Custom": "val" } });

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.headers["X-Custom"]).toBe("val");
      expect(fetchOptions.headers.Authorization).toBe("Bearer test-token");
    });

    it("should throw when response is not ok", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => "Server Error",
      });

      const ctx = buildProcessScriptContext(credentials);
      await expect(ctx.callAction("handler", {})).rejects.toThrow("Server Error");
    });

    it("should throw fallback message when error text fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => {
          throw new Error("stream error");
        },
      });

      const ctx = buildProcessScriptContext(credentials);
      await expect(ctx.callAction("handler", {})).rejects.toThrow("Request failed");
    });
  });

  describe("injectDynamicParameters", () => {
    it("should inject dynamic parameters into map", () => {
      const dynamicParams: DynamicParameter[] = [
        { name: "dp1", reference: "STRING", required: true, refList: [{ value: "a", label: "A" }] },
      ];
      const newParams: ParametersMap = {};
      const injected = injectDynamicParameters(dynamicParams, newParams);

      expect(injected.has("dp1")).toBe(true);
      expect(newParams.dp1).toBeDefined();
      expect((newParams.dp1 as any).DBColumnName).toBe("dp1");
      expect((newParams.dp1 as any).required).toBe(true);
    });

    it("should use default values when optional fields are missing", () => {
      const dynamicParams: DynamicParameter[] = [{ name: "dp2", reference: "NUMBER" }];
      const newParams: ParametersMap = {};
      injectDynamicParameters(dynamicParams, newParams);

      expect((newParams.dp2 as any).required).toBe(false);
      expect((newParams.dp2 as any).refList).toEqual([]);
      expect((newParams.dp2 as any).id).toBe("dp2");
    });

    it("should use provided id when available", () => {
      const dynamicParams: DynamicParameter[] = [{ id: "custom-id", name: "dp3", reference: "STRING" }];
      const newParams: ParametersMap = {};
      injectDynamicParameters(dynamicParams, newParams);

      expect((newParams.dp3 as any).id).toBe("custom-id");
    });
  });

  describe("applyStaticParameterValues", () => {
    it("should filter refList to only include specified values", () => {
      const param = {
        refList: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
        ],
      } as unknown as ProcessParameter;

      const result = applyStaticParameterValues(param, ["a", "c"]);
      expect(result.refList).toEqual([
        { value: "a", label: "A" },
        { value: "c", label: "C" },
      ]);
    });

    it("should handle single value (non-array)", () => {
      const param = {
        refList: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      } as unknown as ProcessParameter;

      const result = applyStaticParameterValues(param, "b");
      expect(result.refList).toEqual([{ value: "b", label: "B" }]);
    });

    it("should not mutate original parameter", () => {
      const param = {
        refList: [{ value: "a", label: "A" }],
      } as unknown as ProcessParameter;

      const result = applyStaticParameterValues(param, "a");
      expect(result).not.toBe(param);
    });
  });

  describe("form-item reducers", () => {
    const params = (): ParametersMap =>
      ({
        amount: { name: "amount", mandatory: false, refList: [] },
        currency: { name: "currency", mandatory: true, refList: [{ value: "USD", label: "USD" }] },
      }) as unknown as ParametersMap;

    describe("withFlag", () => {
      it("sets a flag and returns a new reference", () => {
        const prev = { "a.display": true };
        const next = withFlag(prev, "a.readonly", true);
        expect(next).toEqual({ "a.display": true, "a.readonly": true });
        expect(next).not.toBe(prev);
      });

      it("short-circuits to the same reference when unchanged", () => {
        const prev = { "a.readonly": true };
        expect(withFlag(prev, "a.readonly", true)).toBe(prev);
      });
    });

    describe("footer button-state reducers", () => {
      it("withButtonHidden / withButtonDisabled set per-value flags immutably", () => {
        const hidden = withButtonHidden(EMPTY_SCRIPT_BUTTON_STATE, "DONE", true);
        expect(hidden.hiddenValues).toEqual({ DONE: true });
        expect(hidden).not.toBe(EMPTY_SCRIPT_BUTTON_STATE);

        const disabled = withButtonDisabled(hidden, "DONE", true);
        expect(disabled.disabledValues).toEqual({ DONE: true });
        expect(disabled.hiddenValues).toEqual({ DONE: true });
      });

      it("withCancelHidden / withCloseHidden set the modal-wide flags immutably", () => {
        expect(withCancelHidden(EMPTY_SCRIPT_BUTTON_STATE, true).cancelHidden).toBe(true);
        expect(withCloseHidden(EMPTY_SCRIPT_BUTTON_STATE, true).closeHidden).toBe(true);
      });

      it("withOkForceEnabled sets the force-enabled flag immutably", () => {
        const forced = withOkForceEnabled(EMPTY_SCRIPT_BUTTON_STATE, true);
        expect(forced.okForceEnabled).toBe(true);
        expect(forced).not.toBe(EMPTY_SCRIPT_BUTTON_STATE);
      });

      it("short-circuits to the same reference on a no-op", () => {
        expect(withButtonHidden(EMPTY_SCRIPT_BUTTON_STATE, "DONE", false)).toBe(EMPTY_SCRIPT_BUTTON_STATE);
        expect(withButtonDisabled(EMPTY_SCRIPT_BUTTON_STATE, "DONE", false)).toBe(EMPTY_SCRIPT_BUTTON_STATE);
        expect(withCancelHidden(EMPTY_SCRIPT_BUTTON_STATE, false)).toBe(EMPTY_SCRIPT_BUTTON_STATE);
        expect(withCloseHidden(EMPTY_SCRIPT_BUTTON_STATE, false)).toBe(EMPTY_SCRIPT_BUTTON_STATE);
        expect(withOkForceEnabled(EMPTY_SCRIPT_BUTTON_STATE, false)).toBe(EMPTY_SCRIPT_BUTTON_STATE);
      });

      it("starts with no action overrides", () => {
        expect(EMPTY_SCRIPT_BUTTON_STATE.actionValues).toEqual({});
      });

      it("withButtonAction stores the override keyed by value immutably", () => {
        const action = jest.fn();
        const next = withButtonAction(EMPTY_SCRIPT_BUTTON_STATE, "UN", action);
        expect(next.actionValues).toEqual({ UN: action });
        expect(next).not.toBe(EMPTY_SCRIPT_BUTTON_STATE);
        expect(EMPTY_SCRIPT_BUTTON_STATE.actionValues).toEqual({});
      });

      it("withButtonAction short-circuits when the same action is reassigned", () => {
        const action = jest.fn();
        const first = withButtonAction(EMPTY_SCRIPT_BUTTON_STATE, "UN", action);
        expect(withButtonAction(first, "UN", action)).toBe(first);
      });
    });

    describe("runFooterButtonAction", () => {
      const UN_VALUE = "UN";

      it("runs the assigned override and does NOT call execute", () => {
        const override = jest.fn();
        const execute = jest.fn();
        runFooterButtonAction({ [UN_VALUE]: override }, UN_VALUE, execute);
        expect(override).toHaveBeenCalledTimes(1);
        expect(execute).not.toHaveBeenCalled();
      });

      it("falls back to the standard execute when no override exists", () => {
        const execute = jest.fn();
        runFooterButtonAction({}, UN_VALUE, execute);
        expect(execute).toHaveBeenCalledWith(UN_VALUE);
      });
    });

    describe("makeFooterButtonHandle", () => {
      const collectUpdates = () => {
        const updaters: Array<(prev: ScriptButtonState) => ScriptButtonState> = [];
        const setButtonState = (updater: (prev: ScriptButtonState) => ScriptButtonState) => updaters.push(updater);
        return { updaters, setButtonState };
      };

      it("exposes the button value/title and routes hide/show/setDisabled through the state", () => {
        const { updaters, setButtonState } = collectUpdates();
        const handle = makeFooterButtonHandle({ value: "UN", label: "Unmatch" }, setButtonState);
        expect(handle._buttonValue).toBe("UN");
        expect(handle.title).toBe("Unmatch");

        handle.hide();
        expect(updaters[0](EMPTY_SCRIPT_BUTTON_STATE).hiddenValues).toEqual({ UN: true });
        handle.setDisabled();
        expect(updaters[1](EMPTY_SCRIPT_BUTTON_STATE).disabledValues).toEqual({ UN: true });
      });

      it("honors the Classic `button.action = fn` assignment by routing it into the state", () => {
        const { updaters, setButtonState } = collectUpdates();
        const handle = makeFooterButtonHandle({ value: "UN", label: "Unmatch" }, setButtonState);
        const action = jest.fn();

        handle.action = action;
        expect(handle.action).toBe(action);
        expect(updaters[0](EMPTY_SCRIPT_BUTTON_STATE).actionValues).toEqual({ UN: action });
      });
    });

    describe("withMandatory", () => {
      it("toggles mandatory immutably", () => {
        const prev = params();
        const next = withMandatory(prev, "amount", true);
        expect(next.amount.mandatory).toBe(true);
        expect(next).not.toBe(prev);
        expect(prev.amount.mandatory).toBe(false);
      });

      it("short-circuits when missing or unchanged", () => {
        const prev = params();
        expect(withMandatory(prev, "unknown", true)).toBe(prev);
        expect(withMandatory(prev, "currency", true)).toBe(prev);
      });

      it("resolves a parameter addressed by name when the map is keyed by dBColumnName", () => {
        // Map keyed by dBColumnName ("DocAction"); the hook addresses it by name.
        const prev = {
          DocAction: { name: "Document Action", dBColumnName: "DocAction", mandatory: false, refList: [] },
        } as unknown as ParametersMap;
        const next = withMandatory(prev, "Document Action", true);
        expect(next.DocAction.mandatory).toBe(true);
        expect(next).not.toBe(prev);
      });
    });

    describe("withRefList", () => {
      it("replaces refList immutably", () => {
        const prev = params();
        const next = withRefList(prev, "amount", [{ id: "x", value: "x", label: "X" }]);
        expect(next.amount.refList).toEqual([{ id: "x", value: "x", label: "X" }]);
        expect(next).not.toBe(prev);
      });

      it("short-circuits when the parameter is missing", () => {
        const prev = params();
        expect(withRefList(prev, "unknown", [])).toBe(prev);
      });

      it("resolves by name/dBColumnName and writes under the real map key", () => {
        const options = [{ id: "CO", value: "CO", label: "Book" }];
        const prev = {
          DocAction: { name: "Document Action", dBColumnName: "DocAction", mandatory: true, refList: [] },
        } as unknown as ParametersMap;
        // Addressed by name (≠ map key): must update the "DocAction" entry.
        expect(withRefList(prev, "Document Action", options).DocAction.refList).toEqual(options);
        // Addressed by dBColumnName (== map key): same result.
        expect(withRefList(prev, "DocAction", options).DocAction.refList).toEqual(options);
      });
    });

    describe("normalizeValueMap", () => {
      it("maps an object to ListOption[]", () => {
        expect(normalizeValueMap({ a: "A", b: "B" })).toEqual([
          { id: "a", value: "a", label: "A" },
          { id: "b", value: "b", label: "B" },
        ]);
      });

      it("normalizes an array of strings and of option objects", () => {
        expect(normalizeValueMap(["x"])).toEqual([{ id: "x", value: "x", label: "x" }]);
        expect(normalizeValueMap([{ value: "y", label: "Y" }])).toEqual([{ id: "y", value: "y", label: "Y" }]);
      });

      it("returns an empty list for nullish / primitive input", () => {
        expect(normalizeValueMap(null)).toEqual([]);
        expect(normalizeValueMap(undefined)).toEqual([]);
        expect(normalizeValueMap(42)).toEqual([]);
      });
    });

    describe("addDynamicParameter / removeParameter", () => {
      it("adds a dynamic parameter immutably", () => {
        const prev = params();
        const next = addDynamicParameter(prev, { name: "extra", reference: "10" });
        expect(next.extra).toBeDefined();
        expect(next).not.toBe(prev);
        expect(prev.extra).toBeUndefined();
      });

      it("removes by name and by positional index", () => {
        const prev = params();
        expect(removeParameter(prev, "amount").amount).toBeUndefined();
        expect(removeParameter(prev, 1).currency).toBeUndefined();
      });

      it("short-circuits on unknown or out-of-range targets", () => {
        const prev = params();
        expect(removeParameter(prev, "unknown")).toBe(prev);
        expect(removeParameter(prev, 9)).toBe(prev);
      });
    });
  });

  describe("updateParametersFromOnLoadResult", () => {
    it("should inject dynamic parameters and set form values", () => {
      const setFormValue = jest.fn();
      const prev: ParametersMap = {};
      const result = {
        _dynamicParameters: [{ name: "dp1", reference: "STRING" }],
        dp1: "theValue",
      };

      const updated = updateParametersFromOnLoadResult(result, prev, setFormValue);

      expect(updated.dp1).toBeDefined();
      expect(setFormValue).toHaveBeenCalledWith("dp1", "theValue");
    });

    it("should skip reserved keys", () => {
      const setFormValue = jest.fn();
      const prev: ParametersMap = {};
      const result = {
        _gridSelection: { grid1: ["id1"] },
        autoSelectConfig: {},
        error: "some error",
      };

      const updated = updateParametersFromOnLoadResult(result, prev, setFormValue);

      expect(setFormValue).not.toHaveBeenCalled();
      expect(Object.keys(updated)).toEqual(Object.keys(prev));
    });

    it("should apply static parameter values for existing params", () => {
      const setFormValue = jest.fn();
      const prev: ParametersMap = {
        p1: {
          name: "p1",
          refList: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
        } as unknown as ProcessParameter,
      };
      const result = { p1: ["a"] };

      const updated = updateParametersFromOnLoadResult(result, prev, setFormValue);

      expect(updated.p1.refList).toEqual([{ value: "a", label: "A" }]);
    });

    it("should skip unknown parameter keys", () => {
      const setFormValue = jest.fn();
      const prev: ParametersMap = {};
      const result = { unknownParam: "value" };

      const updated = updateParametersFromOnLoadResult(result, prev, setFormValue);

      expect(setFormValue).not.toHaveBeenCalled();
      expect(updated.unknownParam).toBeUndefined();
    });

    it("should handle empty dynamic parameters", () => {
      const setFormValue = jest.fn();
      const prev: ParametersMap = {};
      const result = { _dynamicParameters: [] };

      const updated = updateParametersFromOnLoadResult(result, prev, setFormValue);

      expect(Object.keys(updated)).toEqual(Object.keys(prev));
    });

    it("should handle no _dynamicParameters key", () => {
      const setFormValue = jest.fn();
      const prev: ParametersMap = {};
      const result = {};

      const updated = updateParametersFromOnLoadResult(result, prev, setFormValue);

      expect(Object.keys(updated)).toEqual(Object.keys(prev));
    });
  });

  describe("applyMergedParam - additional cases", () => {
    it("should set _org for ad_org_id key", () => {
      const options: any = {};
      applyMergedParam("ad_org_id", "org-123", {}, options);
      expect(options._org).toBe("org-123");
    });

    it("should map inpadClientId to ad_client_id", () => {
      const options: any = {};
      applyMergedParam("inpadClientId", "client-1", {}, options);
      expect(options.ad_client_id).toBe("client-1");
    });

    it("should not add to options when value is empty", () => {
      const parameters: any = {
        p1: { name: "Param1", dBColumnName: "db_p1" },
      };
      const options: any = {};
      applyMergedParam("Param1", "", parameters, options);
      expect(options.db_p1).toBeUndefined();
    });

    it("should not add to options when value is null", () => {
      const parameters: any = {
        p1: { name: "Param1", dBColumnName: "db_p1" },
      };
      const options: any = {};
      applyMergedParam("Param1", null, parameters, options);
      expect(options.db_p1).toBeUndefined();
    });

    it("should use key as fallback when no dBColumnName", () => {
      const parameters: any = {
        p1: { name: "Param1" },
      };
      const options: any = {};
      applyMergedParam("Param1", "val", parameters, options);
      expect(options.Param1).toBe("val");
    });

    it("splits multi-record selector CSV values into an array so the proxy emits repeated form-urlencoded keys (matches Classic OBMultiSelectorItem behaviour)", () => {
      const parameters: any = {
        p1: {
          name: "accounting_status",
          dBColumnName: "accounting_status",
          reference: "87E6CFF8F71548AFA33F181C317970B5",
        },
      };
      const options: any = {};
      applyMergedParam("accounting_status", "id1,id2,id3", parameters, options);
      expect(options.accounting_status).toEqual(["id1", "id2", "id3"]);
    });

    it("resolves multi-selector params when the metadata map is keyed by dBColumnName (real ProcessParameter shape: p.name is the display label)", () => {
      // Mirrors the actual Etendo process metadata: the parameters object is
      // keyed by `accounting_status` (dBColumnName) while `p.name` is the
      // display label "Accounting Status". The form posts the value at
      // `accounting_status`, so the lookup must succeed via the map key.
      const parameters: any = {
        accounting_status: {
          name: "Accounting Status",
          dBColumnName: "accounting_status",
          reference: "87E6CFF8F71548AFA33F181C317970B5",
        },
      };
      const options: any = {};
      applyMergedParam("accounting_status", "id1,id2", parameters, options);
      expect(options.accounting_status).toEqual(["id1", "id2"]);
    });

    it("matches by dBColumnName fallback when the form key is the snake_case column and the map key is something else", () => {
      const parameters: any = {
        randomKey: {
          name: "Some Display Label",
          dBColumnName: "some_field",
          reference: "10",
        },
      };
      const options: any = {};
      applyMergedParam("some_field", "value", parameters, options);
      expect(options.some_field).toBe("value");
    });

    it("omits a multi-selector param when the CSV value is empty", () => {
      const parameters: any = {
        p1: {
          name: "accounting_status",
          dBColumnName: "accounting_status",
          reference: "87E6CFF8F71548AFA33F181C317970B5",
        },
      };
      const options: any = {};
      applyMergedParam("accounting_status", "", parameters, options);
      expect(options.accounting_status).toBeUndefined();
    });
  });

  describe("addSelectedIDsToCriteria", () => {
    const SELECTED = ["a", "b"];

    it("merges an id inSet sub-criterion into an existing criteria object", () => {
      const result = addSelectedIDsToCriteria({ operator: "or", criteria: [{ fieldName: "x" }] }, SELECTED);
      expect(result.operator).toBe("or");
      expect(result.criteria).toEqual([{ fieldName: "x" }, { fieldName: "id", operator: "inSet", value: SELECTED }]);
    });

    it("defaults to an `and` combinator when starting from empty criteria", () => {
      const result = addSelectedIDsToCriteria(undefined, SELECTED);
      expect(result).toEqual({
        operator: "and",
        criteria: [{ fieldName: "id", operator: "inSet", value: SELECTED }],
      });
    });

    it("returns the normalized criteria unchanged when there is nothing to add", () => {
      expect(addSelectedIDsToCriteria({ operator: "and" }, [])).toEqual({ operator: "and" });
      expect(addSelectedIDsToCriteria({ operator: "and" }, SELECTED, false)).toEqual({ operator: "and" });
    });
  });
});
