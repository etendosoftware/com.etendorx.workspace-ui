import { renderHook, waitFor } from "@testing-library/react";
import { useTab } from "../useTab";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import type { Tab } from "@workspaceui/api-client/src/api/types";

jest.mock("@workspaceui/api-client/src/api/metadata");
jest.mock("@/utils/logger");

describe("useTab", () => {
  const mockGetTab = Metadata.getTab as jest.MockedFunction<typeof Metadata.getTab>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial state when no tabId is provided", () => {
    const { result } = renderHook(() => useTab());

    expect(result.current.loading).toBe(false);
    expect(result.current.loaded).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(mockGetTab).not.toHaveBeenCalled();
  });

  it("should load tab data successfully", async () => {
    const mockTab = { id: "tab123", name: "Test Tab" } as Tab;
    mockGetTab.mockResolvedValueOnce(mockTab);

    const { result } = renderHook(() => useTab("tab123"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loaded).toBe(true);
    expect(result.current.data).toEqual(mockTab);
    expect(result.current.error).toBeUndefined();
    expect(mockGetTab).toHaveBeenCalledWith("tab123");
  });

  it("should handle error when loading fails", async () => {
    const error = new Error("Failed to load");
    mockGetTab.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useTab("tab123"));

    // initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loaded).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(error);
    expect(logger.warn).toHaveBeenCalledWith(error);
  });
});
