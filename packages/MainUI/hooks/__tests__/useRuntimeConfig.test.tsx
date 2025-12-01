import { renderHook, waitFor } from "@testing-library/react";
import { useRuntimeConfig, RuntimeConfigProvider } from "../../contexts/RuntimeConfigContext";
import type { ReactNode } from "react";

// Mock global fetch
global.fetch = jest.fn();

describe("useRuntimeConfig", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RuntimeConfigProvider>{children}</RuntimeConfigProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch config on mount and return data", async () => {
    const mockConfig = {
      etendoClassicHost: "http://localhost:8080/etendo1",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    const { result } = renderHook(() => useRuntimeConfig(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.config).toBeNull();

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toEqual(mockConfig);
    expect(global.fetch).toHaveBeenCalledWith("/api/config");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle fetch error gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRuntimeConfig(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[RuntimeConfigProvider] Failed to fetch config:", expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it("should only fetch config once on mount", async () => {
    const mockConfig = {
      etendoClassicHost: "http://localhost:8080/etendo",
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    });

    const { result, rerender } = renderHook(() => useRuntimeConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Rerender should not trigger another fetch
    rerender();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle empty config response", async () => {
    const mockConfig = {
      etendoClassicHost: "",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    const { result } = renderHook(() => useRuntimeConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toEqual({
      etendoClassicHost: "",
    });
  });

  it("should set loading to false even when json parsing fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    const { result } = renderHook(() => useRuntimeConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
