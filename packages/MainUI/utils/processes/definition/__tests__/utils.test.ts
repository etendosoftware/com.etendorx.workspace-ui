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
  type DynamicParameter,
  type ParametersMap,
} from "../utils";
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
  });
});
