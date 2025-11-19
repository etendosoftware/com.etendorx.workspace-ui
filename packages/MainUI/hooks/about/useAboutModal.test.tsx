import { renderHook } from "@testing-library/react";
import { useAboutModal } from "./useAboutModal";

// 🔹 Mock de useUserContext
jest.mock("../useUserContext", () => ({
  useUserContext: jest.fn(),
}));

// 🔹 Mock de useRuntimeConfig
jest.mock("../useRuntimeConfig", () => ({
  useRuntimeConfig: jest.fn(),
}));

import { useUserContext } from "../useUserContext";
import { useRuntimeConfig } from "../useRuntimeConfig";

const mockedUseUserContext = useUserContext as jest.Mock;
const mockedUseRuntimeConfig = useRuntimeConfig as jest.Mock;

describe("useAboutModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useRuntimeConfig to return a loading state
    mockedUseRuntimeConfig.mockReturnValue({
      config: null,
      loading: false,
    });
  });

  it("should return the Next.js proxy URL with the user's token", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "/api/erp/meta/legacy/ad_forms/about.html?IsPopUpCall=1&token=abc123",
      loading: false,
    });
  });

  it("should handle correctly if there is no token", () => {
    mockedUseUserContext.mockReturnValue({ token: undefined });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe("/api/erp/meta/legacy/ad_forms/about.html?IsPopUpCall=1&token=undefined");
    expect(result.current.loading).toBe(false);
  });

  it("should always use the Next.js proxy regardless of the token", () => {
    mockedUseUserContext.mockReturnValue({ token: "test-token-123" });

    const { result } = renderHook(() => useAboutModal());

    // Verify it starts with the proxy path, not a full URL
    expect(result.current.aboutUrl).toMatch(/^\/api\/erp\/meta\/legacy/);
    expect(result.current.loading).toBe(false);
  });
});
