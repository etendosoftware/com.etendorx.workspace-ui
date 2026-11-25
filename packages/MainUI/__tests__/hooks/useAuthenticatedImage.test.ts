import { renderHook, waitFor } from "@testing-library/react";
import { useAuthenticatedImage, useAuthenticatedImageState } from "../../hooks/useAuthenticatedImage";
import { expectSessionAwareFetchFor } from "@/utils/tests/sessionAwareFetchMock";
import { createMockURL, createFetchMock, createFetchRejectMock } from "../../hooks/test-utils/imageMockHelpers";

let currentToken: string | null = "mock-token";

jest.mock(
  "@/utils/session/sessionAwareFetch",
  () => require("@/utils/tests/sessionAwareFetchMock").sessionAwareFetchModule
);

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: any) => any) => selector({ token: currentToken }),
}));

describe("useAuthenticatedImage", () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    currentToken = "mock-token";
    const mocks = createMockURL();
    createObjectURLMock = mocks.createObjectURLMock as jest.Mock;
    revokeObjectURLMock = mocks.revokeObjectURLMock as jest.Mock;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should return null if imageId is not provided", async () => {
    const { result } = renderHook(() => useAuthenticatedImage(null));
    expect(result.current).toBe(null);
  });

  it("should return null if token is not available", async () => {
    currentToken = null;
    const { result } = renderHook(() => useAuthenticatedImage("img-123"));
    expect(result.current).toBe(null);
  });

  it("should fetch image and create object URL", async () => {
    const fetchMock = createFetchMock(true, "some image data");

    const { result, unmount } = renderHook(() => useAuthenticatedImage("img-123"));

    expect(result.current).toBe(null);

    await waitFor(() => {
      expect(result.current).toBe("blob:http://localhost/mock-blob-url");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/erp/utility/ShowImage?id=img-123", {
      headers: { Authorization: "Bearer mock-token" },
    });
    expect(createObjectURLMock).toHaveBeenCalled();

    unmount();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/mock-blob-url");
  });

  it("should handle fetch error gracefully", async () => {
    const fetchMock = createFetchMock(false, null, 500, "Server Error");

    const { result } = renderHook(() => useAuthenticatedImage("img-123"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      // Should remain null
      expect(result.current).toBe(null);
    });
  });

  it("should include nocache param when cacheKey is provided", async () => {
    const fetchMock = createFetchMock(true, "data");

    const { result } = renderHook(() => useAuthenticatedImage("img-123", 12345));

    await waitFor(() => {
      expect(result.current).toBe("blob:http://localhost/mock-blob-url");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/erp/utility/ShowImage?id=img-123&nocache=12345", {
      headers: { Authorization: "Bearer mock-token" },
    });
  });

  it("loads the image as a request whose field shows its own error", async () => {
    createFetchMock(true, new Blob(["img"]));

    renderHook(() => useAuthenticatedImage("img-123"));

    await waitFor(() => expectSessionAwareFetchFor("ShowImage?id=img-123", true));
  });

  it("reports the image as failed when it cannot be loaded", async () => {
    createFetchMock(false, null, 500, "Internal Server Error");

    const { result } = renderHook(() => useAuthenticatedImageState("img-123"));

    await waitFor(() => {
      expect(result.current).toEqual({ url: null, failed: true });
    });
  });

  it("is not failed while there is no image to load", () => {
    const { result } = renderHook(() => useAuthenticatedImageState(null));

    expect(result.current).toEqual({ url: null, failed: false });
  });

  it("should catch fetch promise rejection gracefully", async () => {
    createFetchRejectMock("Network Error");

    const { result } = renderHook(() => useAuthenticatedImage("img-123"));

    await waitFor(() => {
      expect(result.current).toBe(null);
    });
  });
});
