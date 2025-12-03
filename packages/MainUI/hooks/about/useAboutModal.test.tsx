import { renderHook } from "@testing-library/react";
import { useAboutModal } from "./useAboutModal";

// 🔹 Mock de useUserContext
jest.mock("../useUserContext", () => ({
  useUserContext: jest.fn(),
}));

// 🔹 Mock de useRuntimeConfig
jest.mock("../../contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: jest.fn(),
}));

import { useUserContext } from "../useUserContext";
import { useRuntimeConfig } from "../../contexts/RuntimeConfigContext";

const mockedUseUserContext = useUserContext as jest.Mock;
const mockedUseRuntimeConfig = useRuntimeConfig as jest.Mock;

describe("useAboutModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useRuntimeConfig to return a loading state by default
    mockedUseRuntimeConfig.mockReturnValue({
      config: null,
      loading: false,
    });
  });

  it("should return empty URL when no etendoClassicHost is configured", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });
    mockedUseRuntimeConfig.mockReturnValue({
      config: null,
      loading: false,
    });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "",
      loading: false,
    });
  });

  it("should return empty URL when config exists but etendoClassicHost is not set", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });
    mockedUseRuntimeConfig.mockReturnValue({
      config: { someOtherConfig: "value" },
      loading: false,
    });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "",
      loading: false,
    });
  });

  it("should return direct Tomcat URL when etendoClassicHost is configured", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });
    mockedUseRuntimeConfig.mockReturnValue({
      config: { etendoClassicHost: "http://localhost:8080" },
      loading: false,
    });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "http://localhost:8080/meta/legacy/ad_forms/about.html?IsPopUpCall=1&token=abc123",
      loading: false,
    });
  });

  it("should handle undefined token correctly when etendoClassicHost is configured", () => {
    mockedUseUserContext.mockReturnValue({ token: undefined });
    mockedUseRuntimeConfig.mockReturnValue({
      config: { etendoClassicHost: "http://localhost:8080" },
      loading: false,
    });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe(
      "http://localhost:8080/meta/legacy/ad_forms/about.html?IsPopUpCall=1&token=undefined"
    );
    expect(result.current.loading).toBe(false);
  });

  it("should return loading state from useRuntimeConfig", () => {
    mockedUseUserContext.mockReturnValue({ token: "test-token" });
    mockedUseRuntimeConfig.mockReturnValue({
      config: { etendoClassicHost: "http://localhost:8080" },
      loading: true,
    });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.loading).toBe(true);
  });
});
