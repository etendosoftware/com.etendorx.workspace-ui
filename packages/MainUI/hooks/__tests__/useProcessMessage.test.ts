import { renderHook, act } from "@testing-library/react";
import { useProcessMessage } from "../useProcessMessage";

// Mock dependencies
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("../useUserContext", () => ({
  useUserContext: () => ({
    token: "test-token",
  }),
}));

jest.mock("../../contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: () => ({
    config: { etendoClassicHost: "http://classic-host" },
  }),
}));

// Mock global fetch
global.fetch = jest.fn();

describe("useProcessMessage", () => {
  const tabId = "test-tab-id";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetchProcessMessage should return processed data on success", async () => {
    const mockData = {
      text: "Success message",
      type: "success",
      title: "Success Title",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useProcessMessage(tabId));

    let message;
    await act(async () => {
      message = await result.current.fetchProcessMessage();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("GetTabMessageActionHandler"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tabId }),
      })
    );
    expect(message).toEqual({
      text: "Success message",
      type: "success",
      title: "Success Title",
    });
  });

  it("fetchMetadataMessage should return processed data on success", async () => {
    const mockData = {
      message: "Metadata success message",
      type: "success",
      title: "Metadata Title",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useProcessMessage(tabId));

    let message;
    await act(async () => {
      message = await result.current.fetchMetadataMessage();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/erp/meta/message?tabId=${tabId}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
    expect(message).toEqual({
      text: "Metadata success message",
      type: "success",
      title: "Metadata Title",
    });
  });

  it("fetchMetadataMessage should return null if response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useProcessMessage(tabId));

    let message;
    await act(async () => {
      message = await result.current.fetchMetadataMessage();
    });

    expect(message).toBeNull();
  });

  it("fetchMetadataMessage should return null if data is empty", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "", type: "" }),
    });

    const { result } = renderHook(() => useProcessMessage(tabId));

    let message;
    await act(async () => {
      message = await result.current.fetchMetadataMessage();
    });

    expect(message).toBeNull();
  });

  it("should normalize message types correctly", async () => {
    const testCases = [
      { input: { message: "Error occurred", type: "Error" }, expectedType: "error" },
      { input: { message: "Successfully saved", type: "success" }, expectedType: "success" },
      { input: { message: "Warning message", type: "Warn" }, expectedType: "warning" },
      { input: { message: "Info message", type: "other" }, expectedType: "info" },
    ];

    const { result } = renderHook(() => useProcessMessage(tabId));

    for (const testCase of testCases) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(testCase.input),
      });

      let message;
      await act(async () => {
        message = await result.current.fetchMetadataMessage();
      });

      expect(message?.type).toBe(testCase.expectedType);
    }
  });

  it("should handle fetch errors gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useProcessMessage(tabId));

    let message;
    await act(async () => {
      message = await result.current.fetchMetadataMessage();
    });

    expect(message).toBeNull();
  });
});
