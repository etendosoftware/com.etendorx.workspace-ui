import { renderHook, act } from "@testing-library/react";
import { buildReloadModalOptions, extractServerErrorMessage, useFormAction } from "../useFormAction";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { FormMode } from "@workspaceui/api-client/src/api/types";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    datasourceServletClient: { request: jest.fn() },
  },
}));

jest.mock("@/utils", () => ({
  buildFormPayload: jest.fn(() => ({ data: {} })),
  buildQueryString: jest.fn(() => "mocked-query-string"),
}));

jest.mock("@/utils/form/entityConfig", () => ({
  shouldRemoveIdFields: jest.fn(() => false),
}));

jest.mock("@/utils/form/normalizeDates", () => ({
  normalizeDates: jest.fn((data) => data),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      user: { id: "test-user-id" },
      setLoginErrorText: jest.fn(),
      setLoginErrorDescription: jest.fn(),
    }),
}));

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ logout: jest.fn() }),
}));

jest.mock("../useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockMetadata = Metadata as jest.Mocked<typeof Metadata>;

describe("useFormAction execute", () => {
  const mockTab = { id: "tab1", entityName: "TestEntity" } as any;
  // submit() mimics react-hook-form's handleSubmit: it returns a function that, when
  // invoked, calls the given callback with the form's current values.
  const fakeSubmit =
    (values: Record<string, unknown>) => (callback: (values: any) => void | Promise<void>) => async () => {
      await callback(values);
    };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Mocks the datasource response, renders {@link useFormAction} with fresh callback mocks,
   * and triggers a save -- the shared arrange/act steps behind every test below, which only
   * differ in the mocked response and their assertions.
   */
  async function saveAndGetCallbacks(mockResponse: { ok: boolean; status: number; data: unknown }) {
    mockMetadata.datasourceServletClient.request.mockResolvedValue(mockResponse as any);

    const onError = jest.fn();
    const onSuccess = jest.fn();
    const onStaleObjectReload = jest.fn();

    const { result } = renderHook(() =>
      useFormAction({
        tab: mockTab,
        mode: FormMode.EDIT,
        onSuccess,
        onError,
        submit: fakeSubmit({ id: "1" }) as any,
        onStaleObjectReload,
      })
    );

    await act(async () => {
      await result.current.save({});
    });

    return { onError, onSuccess, onStaleObjectReload };
  }

  it("calls onError with a reload action on a structured 409 stale-object conflict", async () => {
    const { onError, onSuccess, onStaleObjectReload } = await saveAndGetCallbacks({
      ok: false,
      status: 409,
      data: { error: "@OBJSON_StaleDate@", code: "STALE_OBJECT", cid: "test-cid" },
    });

    expect(onError).toHaveBeenCalledWith("status.staleObjectError", { onReload: onStaleObjectReload });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onError with a reload action on a legacy nested stale-object conflict", async () => {
    const { onError, onStaleObjectReload } = await saveAndGetCallbacks({
      ok: false,
      status: 200,
      data: { response: { status: -4, error: { message: "@OBJSON_StaleDate@" } } },
    });

    expect(onError).toHaveBeenCalledWith("status.staleObjectError", { onReload: onStaleObjectReload });
  });

  it("calls onError with just the message for a non-conflict error (regression check)", async () => {
    const { onError } = await saveAndGetCallbacks({
      ok: false,
      status: 200,
      data: { response: { status: -4, error: { message: "Some field is required" } } },
    });

    // Non-conflict errors fall through to the pre-existing `onError(String(err))` call
    // (Error#toString() format), unchanged by this feature -- single-argument, no reload action.
    expect(onError).toHaveBeenCalledWith("Error: Some field is required");
    expect(onError).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ onReload: expect.anything() })
    );
  });

  it("never calls onError on a successful save (regression check)", async () => {
    const { onError, onSuccess } = await saveAndGetCallbacks({
      ok: true,
      status: 200,
      data: { response: { status: 0, data: [{ id: "1" }] } },
    });

    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({ id: "1" }, {});
  });
});

describe("extractServerErrorMessage", () => {
  it("returns message from response.error.message (process/callout errors)", () => {
    const response = { error: { message: "Process failed" } };
    expect(extractServerErrorMessage(response)).toBe("Process failed");
  });

  it("returns joined field messages from response.errors (validation errors)", () => {
    const response = {
      status: -4,
      errors: { description: "Order.description: Value too long. Length 359, maximum allowed 255" },
    };
    expect(extractServerErrorMessage(response)).toBe(
      "Order.description: Value too long. Length 359, maximum allowed 255"
    );
  });

  it("joins multiple field errors with semicolons", () => {
    const response = {
      status: -4,
      errors: { name: "Name is required", amount: "Amount must be positive" },
    };
    expect(extractServerErrorMessage(response)).toBe("Name is required; Amount must be positive");
  });

  it("prefers error.message over errors when both exist", () => {
    const response = {
      error: { message: "General error" },
      errors: { field: "Field error" },
    };
    expect(extractServerErrorMessage(response)).toBe("General error");
  });

  it("returns fallback for undefined response", () => {
    expect(extractServerErrorMessage(undefined)).toBe("Unknown server error");
  });

  it("returns fallback for empty response", () => {
    expect(extractServerErrorMessage({})).toBe("Unknown server error");
  });

  it("returns fallback when errors object is empty", () => {
    const response = { status: -4, errors: {} };
    expect(extractServerErrorMessage(response)).toBe("Unknown server error");
  });
});

describe("buildReloadModalOptions", () => {
  const t = (key: string) => key;

  it("returns the reload action and label when a reload callback is given", () => {
    const onReload = jest.fn();

    const result = buildReloadModalOptions(onReload, t);

    expect(result).toEqual({ onReload, reloadLabel: "status.staleObjectReloadAction" });
  });

  it("returns undefined when no reload callback is given", () => {
    expect(buildReloadModalOptions(undefined, t)).toBeUndefined();
  });
});
