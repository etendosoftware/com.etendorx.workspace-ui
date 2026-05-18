import { renderHook } from "@testing-library/react";
import { useAboutModal } from "./useAboutModal";
import { useUserContext } from "../useUserContext";

// Mock de useUserContext
jest.mock("../useUserContext", () => ({
  useUserContext: jest.fn(),
}));

const mockedUseUserContext = useUserContext as jest.Mock;

describe("useAboutModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should always return the Next.js proxy URL with token", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "/api/erp/ad_forms/about.html?IsPopUpCall=1&token=abc123",
    });
  });

  it("should return proxy URL regardless of any external config", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe("/api/erp/ad_forms/about.html?IsPopUpCall=1&token=abc123");
  });

  it("should handle undefined token correctly", () => {
    mockedUseUserContext.mockReturnValue({ token: undefined });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe("/api/erp/ad_forms/about.html?IsPopUpCall=1&token=undefined");
  });
});
