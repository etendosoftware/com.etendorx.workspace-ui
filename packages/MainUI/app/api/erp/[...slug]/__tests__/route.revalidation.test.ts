import { GET, POST } from "../route";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "../../../_utils/forwardConfig";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, options?: unknown) => ({ body, options })),
  },
}));

jest.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

jest.mock("@/lib/auth", () => ({
  extractBearerToken: jest.fn(),
}));

jest.mock("../../../_utils/forwardConfig", () => ({
  getErpAuthHeaders: jest.fn(),
}));

jest.mock("../../../_utils/sessionStore", () => ({
  setErpSessionCookie: jest.fn(),
  getErpCsrfToken: jest.fn(),
}));

const ETAG = '"abc123"';
const WINDOW_URL = "http://localhost:3000/api/erp/meta/window/167?language=en_US";

describe("API: /api/erp/[...slug] window and tab revalidation", () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();

  /** Minimal request double, like the other proxy tests (jsdom has no `Request`). */
  const createRequest = (url: string, method: string, headers: Record<string, string> = {}) => {
    const lowerCased = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
    return {
      url,
      method,
      headers: { get: (key: string) => lowerCased[key.toLowerCase()] ?? null },
      text: async () => "",
    } as unknown as Request;
  };

  const params = (...slug: string[]) => ({ params: Promise.resolve({ slug }) });

  /** ERP response double: jsdom's `Response` does not build real `Headers` from an object. */
  const erpResponse = (status: number, body: string | null, headers: Record<string, string> = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: new Headers(headers),
    body,
    text: async () => body ?? "",
  });

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    jest.clearAllMocks();
    (extractBearerToken as jest.Mock).mockReturnValue("test-token");
    (getErpAuthHeaders as jest.Mock).mockReturnValue({ cookieHeader: null, csrfToken: null });
    process.env.ETENDO_CLASSIC_URL = "http://erp.example";
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("forwards If-None-Match and returns the ERP 304 without a body", async () => {
    mockFetch.mockResolvedValueOnce(erpResponse(304, null, { ETag: ETAG, "Cache-Control": "private, no-cache" }));

    const response = await GET(
      createRequest(WINDOW_URL, "GET", { "If-None-Match": ETAG }),
      params("meta", "window", "167")
    );

    const [calledUrl, options] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe("http://erp.example/sws/com.etendoerp.metadata.meta/window/167?language=en_US");
    expect(options.headers["If-None-Match"]).toBe(ETAG);
    expect(options.headers.Authorization).toBe("Bearer test-token");
    expect(response.status).toBe(304);
    expect(response.headers.get("etag")).toBe(ETAG);
    expect(response.headers.get("cache-control")).toBe("private, no-cache");
  });

  it("passes a 200 body through with its ETag", async () => {
    mockFetch.mockResolvedValueOnce(
      erpResponse(200, '{"id":"167"}', {
        ETag: ETAG,
        "Content-Type": "application/json",
        "Set-Cookie": "JSESSIONID=x; Path=/",
      })
    );

    const response = await GET(createRequest(WINDOW_URL, "GET"), params("meta", "window", "167"));

    expect(mockFetch.mock.calls[0][1].headers["If-None-Match"]).toBeUndefined();
    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBe(ETAG);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({ id: "167" });
  });

  it("handles tab definitions the same way", async () => {
    mockFetch.mockResolvedValueOnce(erpResponse(304, null, { ETag: ETAG }));

    const response = await GET(
      createRequest("http://localhost:3000/api/erp/meta/tab/186", "GET", { "If-None-Match": ETAG }),
      params("meta", "tab", "186")
    );

    expect(mockFetch.mock.calls[0][0]).toBe("http://erp.example/sws/com.etendoerp.metadata.meta/tab/186");
    expect(response.status).toBe(304);
  });

  it("keeps the ERP error status so the client can tell access denied apart", async () => {
    mockFetch.mockResolvedValueOnce(erpResponse(401, "denied"));

    const response = (await GET(createRequest(WINDOW_URL, "GET"), params("meta", "window", "167"))) as unknown as {
      options: { status: number };
    };

    expect(response.options.status).toBe(401);
  });

  it("does not use the conditional path for POST requests", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json", has: () => false },
      text: async () => '{"id":"167"}',
      json: async () => ({ id: "167" }),
      arrayBuffer: async () => new ArrayBuffer(0),
    });

    await POST(
      createRequest("http://localhost:3000/api/erp/meta/window/167", "POST", { "If-None-Match": ETAG }),
      params("meta", "window", "167")
    );

    expect(mockFetch.mock.calls[0][1].headers["If-None-Match"]).toBeUndefined();
  });
});
