import { renderHook } from "@testing-library/react";
import { useProcessExecution } from "../useProcessExecution";
import { makeParams } from "../testUtils/makeProcessExecutionParams";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/utils", () => ({
  buildProcessPayload: jest.fn(() => ({})),
}));

jest.mock("@/utils/functions", () => ({
  executeStringFunction: jest.fn(),
}));

jest.mock("@/utils/process/processPayloadMapper", () => ({
  buildProcessParameters: jest.fn(() => ({})),
}));

jest.mock("@/utils/processes/definition/constants", () => ({
  BUTTON_LIST_REFERENCE_ID: "BUTTON_LIST",
  PROCESS_DEFINITION_DATA: {},
  WINDOW_SPECIFIC_KEYS: {},
}));

jest.mock("@/components/ProcessModal/Custom/shared/processModalUtils", () => ({
  parseSmartClientMessage: jest.fn((msg: string) => ({ text: msg, tabId: undefined, recordId: undefined })),
}));

jest.mock("@/utils/window/utils", () => ({
  getNewWindowIdentifier: jest.fn(() => "wi_0"),
}));

jest.mock("@/utils/url/utils", () => ({
  appendWindowToUrl: jest.fn(() => "window=wi_0"),
}));

jest.mock("@/components/ToastContent", () => ({
  ToastContent: jest.fn(),
}));

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { kernelClient: { post: jest.fn() } },
}));

jest.mock("@/utils/propertyStore", () => ({
  createOBShim: jest.fn(() => ({})),
}));

jest.mock("@/app/actions/process", () => ({}));
jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));
jest.mock("sonner", () => ({ toast: jest.fn() }));

// ---------------------------------------------------------------------------
// Fetch tracker — plain closure (NOT jest.fn) so Jest never deep-copies
// FormData / File objects stored in mock.calls and crashes the process.
// ---------------------------------------------------------------------------

interface FetchRecord {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

let lastFetch: FetchRecord | null = null;
let fetchOk = true;
let fetchResponseBody: object = {};

const installFetchMock = (ok = true, body: object = {}) => {
  fetchOk = ok;
  fetchResponseBody = body;
  lastFetch = null;
  global.fetch = ((url: string, options: RequestInit) => {
    lastFetch = {
      url: String(url),
      method: options?.method ?? "",
      headers: (options?.headers ?? {}) as Record<string, string>,
      body: options?.body ?? null,
    };
    return Promise.resolve({
      ok: fetchOk,
      json: () => Promise.resolve(fetchResponseBody),
      text: () => Promise.resolve(fetchOk ? "" : "Error"),
    });
  }) as unknown as typeof fetch;
};

beforeEach(() => installFetchMock());
afterEach(() => {
  lastFetch = null;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeTestFile = (name = "upload.csv") => new File(["data"], name, { type: "text/csv" });

// ---------------------------------------------------------------------------
// Tests — executeJavaProcess: JSON path (no fileParams)
// ---------------------------------------------------------------------------

describe("useProcessExecution — executeJavaProcess without fileParams", () => {
  it("sends a JSON body when fileParams is empty", async () => {
    const { result } = renderHook(() => useProcessExecution(makeParams({ fileParams: {} })));
    await result.current.executeJavaProcess({ _params: { amount: "100" } });

    expect(typeof lastFetch?.body).toBe("string");
    expect(lastFetch?.headers["Content-Type"]).toBe("application/json;charset=UTF-8");
  });

  it("includes Authorization and X-CSRF-Token headers in JSON request", async () => {
    const { result } = renderHook(() =>
      useProcessExecution(makeParams({ fileParams: {}, token: "my-token", getCsrfToken: () => "my-csrf" }))
    );
    await result.current.executeJavaProcess({});

    expect(lastFetch?.headers.Authorization).toBe("Bearer my-token");
    expect(lastFetch?.headers["X-CSRF-Token"]).toBe("my-csrf");
  });

  it("serialises the entire payload as JSON", async () => {
    const payload = { _params: { qty: 5 }, _buttonValue: "done" };
    const { result } = renderHook(() => useProcessExecution(makeParams({ fileParams: {} })));
    await result.current.executeJavaProcess(payload);

    const body = JSON.parse(lastFetch?.body as string);
    expect(body._buttonValue).toBe("done");
    expect(body._params.qty).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Tests — executeJavaProcess: FormData path (with fileParams)
// ---------------------------------------------------------------------------

describe("useProcessExecution — executeJavaProcess with fileParams", () => {
  it("sends a FormData body when fileParams has entries", async () => {
    const file = makeTestFile("report.csv");
    const { result } = renderHook(() => useProcessExecution(makeParams({ fileParams: { upload_col: file } })));
    await result.current.executeJavaProcess({});

    expect(lastFetch?.body).toBeInstanceOf(FormData);
  });

  it("does NOT set Content-Type header (lets browser set multipart boundary)", async () => {
    const file = makeTestFile();
    const { result } = renderHook(() => useProcessExecution(makeParams({ fileParams: { col: file } })));
    await result.current.executeJavaProcess({});

    expect(lastFetch?.headers["Content-Type"]).toBeUndefined();
  });

  it("includes Authorization header in FormData request", async () => {
    const file = makeTestFile();
    const { result } = renderHook(() =>
      useProcessExecution(makeParams({ fileParams: { col: file }, token: "tok-123", getCsrfToken: () => "csrf-abc" }))
    );
    await result.current.executeJavaProcess({});

    expect(lastFetch?.headers.Authorization).toBe("Bearer tok-123");
    expect(lastFetch?.headers["X-CSRF-Token"]).toBe("csrf-abc");
  });

  it("appends the file to FormData under its parameter column name", async () => {
    const file = makeTestFile("data.csv");
    const { result } = renderHook(() => useProcessExecution(makeParams({ fileParams: { my_col: file } })));
    await result.current.executeJavaProcess({});

    const fd = lastFetch?.body as FormData;
    // Access file name to avoid Jest deep-copying a File for diff output
    expect((fd.get("my_col") as File).name).toBe("data.csv");
  });

  it("appends processId to FormData", async () => {
    const file = makeTestFile();
    const { result } = renderHook(() =>
      useProcessExecution(makeParams({ processId: "PROC-XYZ", fileParams: { col: file } }))
    );
    await result.current.executeJavaProcess({});

    const fd = lastFetch?.body as FormData;
    expect(fd.get("processId")).toBe("PROC-XYZ");
  });

  it("appends reportId as the string 'null' to FormData", async () => {
    const file = makeTestFile();
    const { result } = renderHook(() => useProcessExecution(makeParams({ fileParams: { col: file } })));
    await result.current.executeJavaProcess({});

    const fd = lastFetch?.body as FormData;
    expect(fd.get("reportId")).toBe("null");
  });

  it("appends a paramValues JSON string containing the payload", async () => {
    const file = makeTestFile();
    const payload = { _buttonValue: "execute", _params: { note: "test" } };
    const { result } = renderHook(() => useProcessExecution(makeParams({ fileParams: { col: file } })));
    await result.current.executeJavaProcess(payload);

    const fd = lastFetch?.body as FormData;
    const paramValues = JSON.parse(fd.get("paramValues") as string);
    expect(paramValues._buttonValue).toBe("execute");
  });

  it("replaces _params file value with C:\\fakepath\\<name> in the paramValues JSON", async () => {
    const file = makeTestFile("invoice.pdf");
    const payload = { _params: { doc_col: "placeholder" } };
    const { result } = renderHook(() => useProcessExecution(makeParams({ fileParams: { doc_col: file } })));
    await result.current.executeJavaProcess(payload);

    const fd = lastFetch?.body as FormData;
    const paramValues = JSON.parse(fd.get("paramValues") as string);
    expect(paramValues._params.doc_col).toBe("C:\\fakepath\\invoice.pdf");
  });

  it("appends all files when there are multiple file params", async () => {
    const file1 = makeTestFile("a.csv");
    const file2 = makeTestFile("b.pdf");
    const { result } = renderHook(() =>
      useProcessExecution(makeParams({ fileParams: { col_a: file1, col_b: file2 } }))
    );
    await result.current.executeJavaProcess({});

    const fd = lastFetch?.body as FormData;
    expect((fd.get("col_a") as File).name).toBe("a.csv");
    expect((fd.get("col_b") as File).name).toBe("b.pdf");
  });

  it("calls setResult with failure when response is not ok (FormData path)", async () => {
    installFetchMock(false);
    const setResult = jest.fn();
    const file = makeTestFile();
    const { result } = renderHook(() => useProcessExecution(makeParams({ fileParams: { col: file }, setResult })));
    await result.current.executeJavaProcess({});

    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
