import { renderHook } from "@testing-library/react";
import { useAboutModal } from "./useAboutModal";

// 🔹 Mock de constantes
jest.mock("@workspaceui/api-client/src/api/constants", () => ({
  API_IFRAME_FORWARD_PATH: "/ws/api",
}));

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

// ✅ Type assertion: decirle a TS que son mocks
const mockedUseUserContext = useUserContext as jest.Mock;
const mockedUseRuntimeConfig = useRuntimeConfig as jest.Mock;

describe("useAboutModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe retornar la URL completa con el token del usuario", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });
    mockedUseRuntimeConfig.mockReturnValue({
      config: { etendoClassicHost: "https://mi-servidor.com" },
      loading: false,
    });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "https://mi-servidor.com/ws/api/ad_forms/about.html?IsPopUpCall=1&token=abc123",
      loading: false,
    });
  });

  it("debe retornar URL vacía si no hay config", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });
    mockedUseRuntimeConfig.mockReturnValue({ config: null, loading: true });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "",
      loading: true,
    });
  });

  it("debe manejar correctamente si no hay token", () => {
    mockedUseUserContext.mockReturnValue({ token: undefined });
    mockedUseRuntimeConfig.mockReturnValue({
      config: { etendoClassicHost: "http://localhost:8080" },
      loading: false,
    });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe(
      "http://localhost:8080/ws/api/ad_forms/about.html?IsPopUpCall=1&token=undefined"
    );
  });
});
