import { renderHook, waitFor, act } from "@testing-library/react";
import { useImageUpload } from "../../hooks/useImageUpload";
import {
  mockUserContextState,
  mockTranslationState,
  createFetchMock,
  createFetchRejectMock,
} from "../../hooks/test-utils/imageMockHelpers";

let currentToken: string | null = "mock-token";

jest.mock("../../hooks/useUserContext", () => ({
  useUserContext: () => mockUserContextState(currentToken),
}));

jest.mock("../../hooks/useTranslation", () => ({
  useTranslation: () => mockTranslationState(),
}));

describe("useImageUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentToken = "mock-token";
    global.FormData = class MockFormData {
      data = new Map();
      append(key: string, value: any) {
        this.data.set(key, value);
      }
      get(key: string) {
        return this.data.get(key);
      }
    } as any;
  });

  afterAll(() => {
    jest.restoreAllMocks();
    delete (global as any).FormData;
  });

  const uploadParams = {
    file: new File(["dummy"], "dummy.png", { type: "image/png" }),
    columnName: "AD_Image_ID",
    tabId: "tab-123",
    orgId: "org-1",
    existingImageId: "old-img",
  };

  it("should throw error if user is not authenticated", async () => {
    currentToken = null;
    const { result } = renderHook(() => useImageUpload());

    await expect(async () => {
      await act(async () => {
        await result.current.uploadImage(uploadParams);
      });
    }).rejects.toThrow("errors.authentication.message");
    expect(result.current.isUploading).toBe(false);
  });

  it("should upload image successfully", async () => {
    const mockHtmlResponse = "<html><body><script>selector.callback('A1B2C3', 'dummy');</script></body></html>";
    const fetchMock = createFetchMock(true, mockHtmlResponse);

    const { result } = renderHook(() => useImageUpload());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBe(null);

    let uploadResult: any;

    await act(async () => {
      uploadResult = await result.current.uploadImage(uploadParams);
    });

    expect(uploadResult).toEqual({ imageId: "A1B2C3" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe("/api/erp/utility/ImageInfoBLOB");
    expect(callArgs[1].method).toBe("POST");
    expect(callArgs[1].headers).toEqual({ Authorization: "Bearer mock-token" });

    expect(callArgs[1].body.get("inpColumnName")).toBe("AD_Image_ID");
    expect(callArgs[1].body.get("inpadOrgId")).toBe("org-1");

    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should handle error when image parsing fails", async () => {
    createFetchMock(true, "<html>some bad html</html>");

    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await expect(result.current.uploadImage(uploadParams)).rejects.toThrow("image.upload.errors.parseIdFailed");
    });
  });

  it("should handle HTTP upload failure", async () => {
    createFetchMock(false, null, 500, "Internal Server Error");

    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await expect(result.current.uploadImage(uploadParams)).rejects.toThrow(
        "image.upload.errors.uploadFailed: 500 Internal Server Error"
      );
    });
  });

  it("should handle network exception", async () => {
    createFetchRejectMock("Network error");

    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await expect(result.current.uploadImage(uploadParams)).rejects.toThrow("Network error");
    });
  });
});
