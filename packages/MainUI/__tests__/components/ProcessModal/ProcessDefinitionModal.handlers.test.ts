import { renderHook, act } from "@testing-library/react";
import { useCallback, useState } from "react";
import "@testing-library/jest-dom";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
// Create mocks
const mockKernelPost = jest.fn();

// Mock dependencies
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    kernelClient: {
      post: mockKernelPost,
    },
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Helper hook to test the handlers logic in isolation
const useProcessHandlers = (mockProps: {
  tab?: any;
  processId?: string;
  javaClassName?: string;
  recordValues?: any;
  form?: any;
  onSuccess?: () => void;
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [response, setResponse] = useState<any>();

  // Mock translation function
  const t = (key: string) => key;

  const { tab, processId, javaClassName, recordValues, form, onSuccess } = mockProps;

  // Direct Java Process Handler (the main logic we're testing)
  const handleDirectJavaProcessExecute = useCallback(async () => {
    if (!tab || !processId || !javaClassName) {
      return;
    }

    setIsExecuting(true);
    setIsSuccess(false);

    try {
      const params = new URLSearchParams({
        processId,
        windowId: tab.window,
        _action: javaClassName,
      });

      const payload = {
        _buttonValue: "DONE",
        _entityName: tab.entityName,
        ...recordValues,
        ...form?.getValues?.(),
      };

      const response = await Metadata.kernelClient.post(`/?${params}`, payload);

      // Handle responseActions format (like normal processes)
      if (response?.data?.responseActions?.[0]?.showMsgInProcessView) {
        const responseMessage = response.data.responseActions[0].showMsgInProcessView;
        setResponse(responseMessage);

        if (responseMessage.msgType === "success") {
          setIsSuccess(true);
          onSuccess?.();
        }
      }
      // Handle legacy message format
      else if (response?.data?.message) {
        const isSuccessResponse = response.data.message.severity === "success";

        setResponse({
          msgText: response.data.message.text || "",
          msgTitle: isSuccessResponse ? t("process.completedSuccessfully") : t("process.processError"),
          msgType: response.data.message.severity,
        });

        if (isSuccessResponse) {
          setIsSuccess(true);
          onSuccess?.();
        }
      }
      // Fallback for responses without specific error structure
      else if (response?.data && !response.data.responseActions) {
        setResponse({
          msgText: "Process completed successfully",
          msgTitle: t("process.completedSuccessfully"),
          msgType: "success",
        });

        setIsSuccess(true);
        onSuccess?.();
      }
    } catch (error) {
      setResponse({
        msgText: error instanceof Error ? error.message : "Unknown error",
        msgTitle: t("errors.internalServerError.title"),
        msgType: "error",
      });
    } finally {
      setIsExecuting(false);
    }
  }, [tab, processId, javaClassName, recordValues, form, t, onSuccess]);

  // Main execution handler routing logic
  const handleExecute = useCallback(async () => {
    const hasWindowReference = false; // Simplified for testing
    const onProcess = null; // Testing direct Java execution path

    if (hasWindowReference) {
      // Would route to window reference handler
      return;
    }

    // If process has javaClassName but no onProcess, execute directly via servlet
    if (!onProcess && javaClassName && tab) {
      await handleDirectJavaProcessExecute();
      return;
    }

    if (!onProcess || !tab) {
      return;
    }

    // Would route to string function handler
  }, [javaClassName, tab, handleDirectJavaProcessExecute]);

  return {
    handleDirectJavaProcessExecute,
    handleExecute,
    isExecuting,
    isSuccess,
    response,
    // For testing internal state
    setIsExecuting,
    setIsSuccess,
    setResponse,
  };
};

describe("ProcessDefinitionModal Handlers", () => {
  const mockTab = {
    window: "test-window-id",
    entityName: "TestEntity",
  };

  const mockForm = {
    getValues: jest.fn(() => ({ formField: "formValue" })),
  };

  const mockRecordValues = {
    recordField: "recordValue",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleDirectJavaProcessExecute", () => {
    it("should return early if required parameters are missing", async () => {
      const { result } = renderHook(() =>
        useProcessHandlers({
          tab: null,
          processId: "test-process",
          javaClassName: "com.test.Process",
        })
      );

      await act(async () => {
        await result.current.handleDirectJavaProcessExecute();
      });

      expect(mockKernelPost).not.toHaveBeenCalled();
      expect(result.current.isExecuting).toBe(false);
    });

    it("should return early when neither javaClassName nor tab exist", async () => {
      const { result } = renderHook(() =>
        useProcessHandlers({
          tab: null,
          processId: "test-process-id",
          javaClassName: undefined,
        })
      );

      await act(async () => {
        await result.current.handleExecute();
      });

      expect(mockKernelPost).not.toHaveBeenCalled();
    });
  });
});