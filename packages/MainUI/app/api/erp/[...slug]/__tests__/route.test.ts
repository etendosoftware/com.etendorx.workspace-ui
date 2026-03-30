import { GET, POST } from "../route";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "../../../_utils/forwardConfig";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: any, options?: any) => ({ body, options })),
  },
}));

jest.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

jest.mock("@/lib/auth", () => ({
  extractBearerToken: jest.fn(),
}));

jest.mock("../../../_utils/forwardConfig", () => ({
  getErpAuthHeaders: jest.fn(),
}));

describe("API: /api/erp/[...slug]/route", () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    jest.clearAllMocks();
    (extractBearerToken as jest.Mock).mockReturnValue("test-token");
    (getErpAuthHeaders as jest.Mock).mockReturnValue({
      cookieHeader: null,
      csrfToken: null,
    });
    process.env.ETENDO_CLASSIC_URL = "http://erp.example";
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const createRequest = (url: string, method: string, body?: any, headers?: Record<string, string>) => {
    return {
      url,
      method,
      headers: {
        get: (key: string) => (headers ? headers[key] : null),
      },
      text: async () => body,
      body: typeof ReadableStream !== "undefined" && body instanceof ReadableStream ? body : undefined,
    } as any;
  };

  it("should treat utility/ShowImage as mutation route when doing GET request", async () => {
    const req = createRequest("http://localhost:3000/api/erp/utility/ShowImage", "GET");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => '{"success":true}',
      json: async () => ({ success: true }),
      arrayBuffer: async () => new ArrayBuffer(0),
      arrayBuffer: async () => new ArrayBuffer(0),
    } as any);

    await GET(req, { params: Promise.resolve({ slug: ["utility", "ShowImage"] }) });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = mockFetch.mock.calls[0];
    // utility/ShowImage doesn't use standard generic metadata proxy, it proxies straight to /utility/ShowImage
    expect(calledUrl).toContain("utility/ShowImage");
    expect(options.method).toBe("GET");
  });

  it("should include Authorization header for other endpoints", async () => {
    const req = createRequest("http://localhost:3000/api/erp/other/Endpoint", "POST", '{"data":1}');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => '{"success":true}',
      json: async () => ({ success: true }),
      arrayBuffer: async () => new ArrayBuffer(0),
    } as any);

    await POST(req, { params: Promise.resolve({ slug: ["other", "Endpoint"] }) });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer test-token");
  });
});
