import { renderHook } from "@testing-library/react";
import { useAboutModal } from "./useAboutModal";
import { useUserStore } from "@/stores/userStore";

describe("useAboutModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.setState({ token: null });
  });

  it("should always return the Next.js proxy URL with token", () => {
    useUserStore.setState({ token: "abc123" });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "/api/erp/ad_forms/about.html?IsPopUpCall=1&token=abc123",
    });
  });

  it("should return proxy URL regardless of any external config", () => {
    useUserStore.setState({ token: "abc123" });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe("/api/erp/ad_forms/about.html?IsPopUpCall=1&token=abc123");
  });

  it("should handle null token correctly", () => {
    useUserStore.setState({ token: null });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe("/api/erp/ad_forms/about.html?IsPopUpCall=1&token=null");
  });
});
