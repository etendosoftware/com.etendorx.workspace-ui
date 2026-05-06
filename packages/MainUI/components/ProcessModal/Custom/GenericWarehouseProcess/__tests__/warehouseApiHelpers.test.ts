import { createCallAction, createFetchDatasource } from "../warehouseApiHelpers";

describe("warehouseApiHelpers", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createCallAction", () => {
    const callAction = createCallAction("test-token", "default-pid");

    it("should POST to kernel endpoint with correct auth headers", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ result: "ok" }),
      });

      const result = await callAction("com.example.Handler", { key: "val" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/erp/org.openbravo.client.kernel?processId=default-pid&_action=com.example.Handler"
        ),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
      expect(result).toEqual({ result: "ok" });
    });

    it("should wrap params in _params by default", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await callAction("handler", { foo: "bar" });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body._params).toEqual({ foo: "bar" });
      expect(body._buttonValue).toBe("DONE");
    });

    it("should send params at top level when _topLevel is true", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await callAction("handler", { foo: "bar", _topLevel: true });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.foo).toBe("bar");
      expect(body._params).toBeUndefined();
      expect(body._topLevel).toBeUndefined();
    });

    it("should use processId override when provided", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await callAction("handler", { processId: "custom-pid" });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain("processId=custom-pid");
    });

    it("should include _entityName at top level when provided", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await callAction("handler", { _entityName: "MyEntity", data: "val" });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body._entityName).toBe("MyEntity");
      expect(body._params.data).toBe("val");
    });

    it("should throw when response is not ok", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(callAction("handler", {})).rejects.toThrow("callAction failed: 500");
    });
  });

  describe("createFetchDatasource", () => {
    const fetchDatasource = createFetchDatasource("test-token");

    it("should POST to /api/datasource with entity and params", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ rows: [{ id: "1" }] }),
      });

      const result = await fetchDatasource("MyEntity", { filter: "active" });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/datasource",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
          body: JSON.stringify({ entity: "MyEntity", params: { filter: "active" } }),
        })
      );
      expect(result).toEqual({ rows: [{ id: "1" }] });
    });

    it("should throw when response is not ok", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(fetchDatasource("Entity", {})).rejects.toThrow("fetchDatasource failed: 404");
    });
  });
});
