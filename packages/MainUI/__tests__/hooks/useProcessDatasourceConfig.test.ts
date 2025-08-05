import { renderHook, act } from "@testing-library/react";
import { useProcessConfig } from "@/hooks/datasource/useProcessDatasourceConfig";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

// Mock the metadata client
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    kernelClient: {
      post: jest.fn(),
    },
  },
}));

// Mock the logger
jest.mock("@/utils/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockPost = Metadata.kernelClient.post as jest.MockedFunction<typeof Metadata.kernelClient.post>;

describe("useProcessConfig", () => {
  const defaultProps = {
    processId: "test-process-id",
    windowId: "test-window-id",
    tabId: "test-tab-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useProcessConfig(defaultProps));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.config).toBe(null);
    expect(typeof result.current.fetchConfig).toBe("function");
  });

  it("should fetch config successfully", async () => {
    const mockResponse = {
      data: {
        defaults: { field1: { value: "value1", identifier: "id1" } },
        filterExpressions: { filter1: { expr: "expression1" } },
        refreshParent: true,
      },
    };

    mockPost.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useProcessConfig(defaultProps));

    await act(async () => {
      const config = await result.current.fetchConfig({ testPayload: "test" });
      
      expect(config).toEqual({
        processId: "test-process-id",
        defaults: { field1: { value: "value1", identifier: "id1" } },
        filterExpressions: { filter1: { expr: "expression1" } },
        refreshParent: true,
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.config).toEqual({
      processId: "test-process-id",
      defaults: { field1: { value: "value1", identifier: "id1" } },
      filterExpressions: { filter1: { expr: "expression1" } },
      refreshParent: true,
    });
  });

  it("should handle missing required parameters", async () => {
    const { result } = renderHook(() => useProcessConfig({
      processId: "",
      windowId: "test-window-id",
      tabId: "test-tab-id",
    }));

    await act(async () => {
      const config = await result.current.fetchConfig();
      expect(config).toBe(null);
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it("should handle API errors", async () => {
    const mockError = new Error("API Error");
    mockPost.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useProcessConfig(defaultProps));

    await act(async () => {
      const config = await result.current.fetchConfig();
      expect(config).toBe(null);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(new Error("API Error"));
    expect(result.current.config).toBe(null);
  });
});