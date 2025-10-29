import { renderHook } from "@testing-library/react";
import { useAboutModal } from "../useAboutModal";

// Mock useUserContext
jest.mock("../../useUserContext", () => ({
  useUserContext: jest.fn(() => ({
    token: "test-token-123",
  })),
}));

describe("useAboutModal", () => {
  it("should return about URL with token from user context", () => {
    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe(
      "/api/erp/meta/legacy/ad_forms/about.html?IsPopUpCall=1&token=test-token-123"
    );
  });

  it("should construct correct URL path for legacy servlet", () => {
    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toContain("/api/erp/meta/legacy");
    expect(result.current.aboutUrl).toContain("ad_forms/about.html");
  });

  it("should include IsPopUpCall parameter", () => {
    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toContain("IsPopUpCall=1");
  });

  it("should append token as query parameter", () => {
    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toContain("token=test-token-123");
  });
});
