import { renderHook } from "@testing-library/react";
import { useAboutModal } from "./useAboutModal";

// 🔹 Mock de useUserContext
jest.mock("../useUserContext", () => ({
  useUserContext: jest.fn(),
}));

import { useUserContext } from "../useUserContext";

// ✅ Type assertion: decirle a TS que son mocks
const mockedUseUserContext = useUserContext as jest.Mock;

describe("useAboutModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe retornar la URL del proxy de Next.js con el token del usuario", () => {
    mockedUseUserContext.mockReturnValue({ token: "abc123" });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current).toEqual({
      aboutUrl: "/api/erp/meta/legacy/ad_forms/about.html?IsPopUpCall=1&token=abc123",
    });
  });

  it("debe manejar correctamente si no hay token", () => {
    mockedUseUserContext.mockReturnValue({ token: undefined });

    const { result } = renderHook(() => useAboutModal());

    expect(result.current.aboutUrl).toBe("/api/erp/meta/legacy/ad_forms/about.html?IsPopUpCall=1&token=undefined");
  });

  it("debe usar siempre el proxy de Next.js independientemente del token", () => {
    mockedUseUserContext.mockReturnValue({ token: "test-token-123" });

    const { result } = renderHook(() => useAboutModal());

    // Verify it starts with the proxy path, not a full URL
    expect(result.current.aboutUrl).toMatch(/^\/api\/erp\/meta\/legacy/);
  });
});
