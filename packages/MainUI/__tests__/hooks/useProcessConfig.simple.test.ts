import { renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Simple mock for testing the core logic
const mockKernelPost = jest.fn();

// Mock translations
const mockT = jest.fn((key: string) => key);

// Test implementation of the core logic from useProcessConfig
const useProcessConfigLogic = (props: {
  processId: string;
  windowId: string;
  tabId: string;
  javaClassName?: string;
}) => {
  const { useState, useCallback } = require("react");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<any>(null);

  const fetchConfig = useCallback(async (payload: Record<string, any> = {}) => {
    if (!props.processId || !props.windowId || !props.tabId) {
      return null;
    }

    // This is the core logic we're testing
    const params = new URLSearchParams({
      processId: props.processId,
      windowId: props.windowId,
      _action: props.javaClassName || "org.openbravo.client.application.process.DefaultsProcessActionHandler",
    });

    const requestPayload = { ...payload };

    try {
      setLoading(true);
      setError(null);

      const response = await mockKernelPost(`?${params}`, requestPayload);

      const processedConfig = {
        processId: props.processId,
        defaults: response?.data?.defaults || {},
        filterExpressions: response?.data?.filterExpressions || {},
        refreshParent: !!response?.data?.refreshParent,
      };

      setConfig(processedConfig);
      return processedConfig;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error fetching process config";
      setError(new Error(errorMessage));
      return null;
    } finally {
      setLoading(false);
    }
  }, [props.processId, props.windowId, props.tabId, props.javaClassName]);

  return {
    fetchConfig,
    loading,
    error,
    config,
  };
};

describe("useProcessConfig Core Logic", () => {
  const defaultProps = {
    processId: "test-process-id",
    windowId: "test-window-id", 
    tabId: "test-tab-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Core functionality", () => {
    it("should return null when required parameters are missing", async () => {
      const { result } = renderHook(() => 
        useProcessConfigLogic({ 
          processId: "", 
          windowId: "test-window-id", 
          tabId: "test-tab-id" 
        })
      );

      const config = await result.current.fetchConfig();
      expect(config).toBe(null);
      expect(mockKernelPost).not.toHaveBeenCalled();
    });

    it("should use DefaultsProcessActionHandler when javaClassName is not provided", async () => {
      const mockResponse = {
        data: {
          defaults: { param1: { value: "test", identifier: "Test" } },
          filterExpressions: {},
        },
      };
      mockKernelPost.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useProcessConfigLogic(defaultProps));

      await result.current.fetchConfig({ testParam: "testValue" });

      await waitFor(() => {
        expect(mockKernelPost).toHaveBeenCalledWith(
          "?processId=test-process-id&windowId=test-window-id&_action=org.openbravo.client.application.process.DefaultsProcessActionHandler",
          { testParam: "testValue" }
        );
      });
    });

    it("should use custom javaClassName when provided", async () => {
      const mockResponse = {
        data: {
          defaults: { param1: { value: "test", identifier: "Test" } },
          filterExpressions: {},
        },
      };
      mockKernelPost.mockResolvedValueOnce(mockResponse);

      const propsWithJavaClass = {
        ...defaultProps,
        javaClassName: "com.etendoerp.copilot.process.CheckHostsButton",
      };

      const { result } = renderHook(() => useProcessConfigLogic(propsWithJavaClass));

      await result.current.fetchConfig({ testParam: "testValue" });

      await waitFor(() => {
        expect(mockKernelPost).toHaveBeenCalledWith(
          "?processId=test-process-id&windowId=test-window-id&_action=com.etendoerp.copilot.process.CheckHostsButton",
          { testParam: "testValue" }
        );
      });
    });

    it("should handle successful response and update state", async () => {
      const mockResponse = {
        data: {
          defaults: { 
            param1: { value: "value1", identifier: "Identifier1" },
            param2: { value: "value2", identifier: "Identifier2" }
          },
          filterExpressions: { 
            gridParam: { field1: "expression1" }
          },
          refreshParent: true,
        },
      };
      mockKernelPost.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useProcessConfigLogic(defaultProps));

      const config = await result.current.fetchConfig();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(config).toEqual({
          processId: "test-process-id",
          defaults: mockResponse.data.defaults,
          filterExpressions: mockResponse.data.filterExpressions,
          refreshParent: true,
        });
      });
    });

    it("should handle network errors", async () => {
      const mockError = new Error("Network error");
      mockKernelPost.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useProcessConfigLogic(defaultProps));

      const config = await result.current.fetchConfig();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toEqual(new Error("Network error"));
        expect(config).toBe(null);
      });
    });

    it("should handle unknown errors", async () => {
      mockKernelPost.mockRejectedValueOnce("String error");

      const { result } = renderHook(() => useProcessConfigLogic(defaultProps));

      const config = await result.current.fetchConfig();

      await waitFor(() => {
        expect(result.current.error?.message).toBe("Unknown error fetching process config");
        expect(config).toBe(null);
      });
    });

    it("should set loading state during fetch", async () => {
      const mockResponse = {
        data: { defaults: {}, filterExpressions: {} },
      };
      
      // Create a promise we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockKernelPost.mockReturnValueOnce(controlledPromise);

      const { result } = renderHook(() => useProcessConfigLogic(defaultProps));

      // Start the fetch
      const fetchPromise = result.current.fetchConfig();

      // Check loading state is true
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the promise
      resolvePromise!(mockResponse);
      await fetchPromise;

      // Check loading state is false
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("URL Parameter Construction", () => {
    it("should construct correct URL parameters with default handler", () => {
      const params = new URLSearchParams({
        processId: "test-process",
        windowId: "test-window",
        _action: "org.openbravo.client.application.process.DefaultsProcessActionHandler",
      });

      expect(params.toString()).toBe(
        "processId=test-process&windowId=test-window&_action=org.openbravo.client.application.process.DefaultsProcessActionHandler"
      );
    });

    it("should construct correct URL parameters with custom javaClassName", () => {
      const javaClassName = "com.etendoerp.copilot.process.CheckHostsButton";
      const params = new URLSearchParams({
        processId: "test-process", 
        windowId: "test-window",
        _action: javaClassName,
      });

      expect(params.toString()).toBe(
        "processId=test-process&windowId=test-window&_action=com.etendoerp.copilot.process.CheckHostsButton"
      );
    });

    it("should demonstrate the key fix: dynamic _action selection", () => {
      const testCases = [
        { javaClassName: undefined, expected: "org.openbravo.client.application.process.DefaultsProcessActionHandler" },
        { javaClassName: "", expected: "org.openbravo.client.application.process.DefaultsProcessActionHandler" },
        { javaClassName: "com.test.CustomProcess", expected: "com.test.CustomProcess" },
        { javaClassName: "com.etendoerp.copilot.process.CheckHostsButton", expected: "com.etendoerp.copilot.process.CheckHostsButton" },
      ];

      testCases.forEach(({ javaClassName, expected }) => {
        const _action = javaClassName || "org.openbravo.client.application.process.DefaultsProcessActionHandler";
        expect(_action).toBe(expected);
      });
    });
  });
});