import { performHealthCheck, performCopilotHealthCheck } from "../health-check";
import { logger } from "@/utils/logger";

jest.mock("@/utils", () => ({
  delay: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("health-check", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("performHealthCheck", () => {
    it("should call onSuccess when response is ok", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      const controller = new AbortController();
      const onSuccess = jest.fn();
      const onError = jest.fn();

      await performHealthCheck(controller.signal, 3, 100, onSuccess, onError);

      expect(onSuccess).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it("should call onError when max attempts are reached", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, statusText: "Not Found" });
      const controller = new AbortController();
      const onSuccess = jest.fn();
      const onError = jest.fn();

      await performHealthCheck(controller.signal, 2, 100, onSuccess, onError);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });

    it("should abort prematurely if signal is aborted during attempts", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network Error"));
      const controller = new AbortController();
      const onSuccess = jest.fn();
      const onError = jest.fn();

      // Trigger the abort immediately prior to fetch invocation
      controller.abort();
      
      const p = performHealthCheck(controller.signal, 2, 100, onSuccess, onError);
      await p;

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("performCopilotHealthCheck", () => {
    it("should return success when request is successful", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "success data",
        headers: new Headers(),
      });

      const response = await performCopilotHealthCheck("http://erp.example", "mock-token");
      expect(response).toEqual({ success: true, data: "success data", status: 200 });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });

    it("should return false and error when request fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
        headers: new Headers(),
      });

      const response = await performCopilotHealthCheck("http://erp.example", "");
      expect(response).toEqual({ success: false, error: "Internal Server Error", status: 500 });
    });

    it("should handle thrown errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network Failure"));

      const response = await performCopilotHealthCheck("http://erp.example", "mock-token");
      expect(response).toEqual({ success: false, error: "Network Failure" });
    });
  });
});
