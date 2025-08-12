import { renderHook } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the Metadata kernelClient
const mockKernelPost = jest.fn();

// Mock the @workspaceui/api-client module
jest.mock("@workspaceui/api-client", () => ({
  Metadata: {
    kernelClient: {
      post: mockKernelPost,
    },
  },
}));

// Mock the logger
jest.mock("@/utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { useProcessConfig } from "@/hooks/datasource/useProcessDatasourceConfig";

describe("useProcessConfig", () => {
  const defaultProps = {
    processId: "test-process-id",
    windowId: "test-window-id",
    tabId: "test-tab-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Hook initialization", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() => useProcessConfig(defaultProps));

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.config).toBe(null);
      expect(typeof result.current.fetchConfig).toBe("function");
    });
  });

  describe("fetchConfig function", () => {
    it("should return null when required parameters are missing", async () => {
      const { result } = renderHook(() =>
        useProcessConfig({
          processId: "",
          windowId: "test-window-id",
          tabId: "test-tab-id",
        })
      );

      const config = await result.current.fetchConfig();
      expect(config).toBe(null);
      expect(mockKernelPost).not.toHaveBeenCalled();
    });
  });
});
