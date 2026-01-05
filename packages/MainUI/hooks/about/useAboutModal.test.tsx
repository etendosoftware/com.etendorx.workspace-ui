import { renderHook } from "@testing-library/react";
import { useAboutModal } from "./useAboutModal";
import { useUserContext } from "../useUserContext";
import { useRuntimeConfig } from "../../contexts/RuntimeConfigContext";

// Mock de useUserContext
jest.mock("../useUserContext", () => ({
  useUserContext: jest.fn(),
}));

// Mock de useRuntimeConfig
jest.mock("../../contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: jest.fn(),
}));

const mockedUseUserContext = useUserContext as jest.Mock;
const mockedUseRuntimeConfig = useRuntimeConfig as jest.Mock;

describe("useAboutModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the correct classic URL with token when etendoClassicHost is available", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });
    mockedUseRuntimeConfig.mockReturnValue({
      config: { etendoClassicHost: "http://localhost:8080/etendo" },
    });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "/api/erp/ad_forms/about.html?IsPopUpCall=1&token=abc123",
    });
  });

  it("should return proxy URL even when etendoClassicHost is not available", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });
    mockedUseRuntimeConfig.mockReturnValue({ config: {} });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe("/api/erp/ad_forms/about.html?IsPopUpCall=1&token=abc123");
  });

  it("should handle undefined token correctly", () => {
    mockedUseUserContext.mockReturnValue({ token: undefined });
    mockedUseRuntimeConfig.mockReturnValue({
      config: { etendoClassicHost: "http://localhost:8080/etendo" },
    });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe("/api/erp/ad_forms/about.html?IsPopUpCall=1&token=undefined");
  });
});
