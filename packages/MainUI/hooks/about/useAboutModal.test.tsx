import { renderHook } from "@testing-library/react";
import { useAboutModal } from "./useAboutModal";
import { useUserContext } from "../useUserContext";

// 🔹 Mock de useUserContext
jest.mock("../useUserContext", () => ({
  useUserContext: jest.fn(),
}));

const mockedUseUserContext = useUserContext as jest.Mock;

describe("useAboutModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the correct API URL with token", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "/api/erp/meta/legacy/ad_forms/about.html?IsPopUpCall=1&token=abc123",
    });
  });

  it("should handle undefined token correctly", () => {
    mockedUseUserContext.mockReturnValue({ token: undefined });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe("/api/erp/meta/legacy/ad_forms/about.html?IsPopUpCall=1&token=undefined");
  });
});
