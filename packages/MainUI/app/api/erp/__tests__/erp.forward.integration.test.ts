import { createDatasourceTestSuite, mockFetchFactory } from "@/app/api/_test-utils/datasource-test-utils";

const suite = createDatasourceTestSuite("BFF /api/erp - forward integration", "default");

suite.describe(() => {
  test("ERP-GET-01: GET transparent forward preserves path and query", async () => {
    // Arrange
    const responseBody = { result: "ok" };
    (global.fetch as jest.Mock) = mockFetchFactory({ status: 200, json: responseBody });

    const req = suite.createErpRequest({
      url: "http://localhost:3000/api/erp/some/path?foo=bar",
      method: "GET",
      bearer: "token-default",
    });

    const { GET } = await import("@/app/api/erp/[...slug]/route");

    // Act
    const res = await GET(req as any, { params: { slug: ["some", "path"] } } as any);

    // Assert
    expect(res).toBeDefined();
    expect(res.status).toBe(200);

    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [dest, init] = fetchMock.mock.calls[0];
    const expectedUrl = `${process.env.ETENDO_CLASSIC_URL}/sws/com.etendoerp.metadata.some/path?foo=bar`;
    expect(String(dest)).toBe(expectedUrl);
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer token-default");
  });

  test("ERP-POST-01: POST with body forward preserves body and Authorization", async () => {
    // Mock session store functions
    const { setErpSessionCookie } = await import("@/app/api/_utils/sessionStore");
    setErpSessionCookie("token-default", {
      cookieHeader: "JSESSIONID=test-session",
      csrfToken: "test-csrf-token",
    });

    // Import the route after setting up mocks
    const { POST } = await import("@/app/api/erp/[...slug]/route");

    const responseBody = { created: true };
    // Configure fetch mock directly
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify(responseBody),
      json: async () => responseBody,
      arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(responseBody)).buffer,
    });

    const payload = { data: "value" };
    const req = suite.createErpRequest({
      url: "http://localhost:3000/api/erp/endpoint",
      method: "POST",
      bearer: "token-default",
      body: JSON.stringify(payload),
      contentType: "application/json",
    });

    const res = await POST(req as any, { params: { slug: ["endpoint"] } } as any);

    expect(res).toBeDefined();
    expect(res.status).toBe(200);

    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [dest, init] = fetchMock.mock.calls[0];
    const expectedUrl = `${process.env.ETENDO_CLASSIC_URL}/sws/com.etendoerp.metadata.endpoint`;
    expect(String(dest)).toBe(expectedUrl);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(payload));
    expect(init.headers.Authorization).toBe("Bearer token-default");
  });
});
