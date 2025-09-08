import { createDatasourceTestSuite, mockFetchFactory } from "@/app/api/_test-utils/datasource-test-utils";

const suite = createDatasourceTestSuite("BFF /api/datasource - cookie policy integration", "default");

suite.describe(() => {
  test("COOKIE-01: ERP_FORWARD_COOKIES=false should NOT forward browser cookies to ERP", async () => {
    // Arrange: ensure ERP_FORWARD_COOKIES is false for this test
    process.env.ERP_FORWARD_COOKIES = "false";

    const body = { entity: "Customer", params: { _startRow: 0 } };
    (global.fetch as jest.Mock) = mockFetchFactory({ status: 200, json: { response: { status: 0 } } });

    const req = suite.createErpRequest({
      url: "http://localhost:3000/api/datasource",
      method: "POST",
      bearer: "token-default",
      body: JSON.stringify(body),
      contentType: "application/json",
      cookie: "JSESSIONID=abc123; other=1",
    });

    // Import the route after mocks
    const { POST } = await import("@/app/api/datasource/route");

    // Act
    const res = await POST(req as any);

    // Assert response
    expect(res).toBeDefined();
    expect((res as any).status).toBe(200);

    // Inspect fetch call headers: Cookie should NOT be present
    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Cookie).toBeUndefined();
  });

  test("COOKIE-02: ERP_FORWARD_COOKIES=true should forward browser cookies to ERP", async () => {
    // Arrange: enable cookie forwarding
    process.env.ERP_FORWARD_COOKIES = "true";

    const body = { entity: "Customer", params: { _startRow: 0 } };
    (global.fetch as jest.Mock) = mockFetchFactory({ status: 200, json: { response: { status: 0 } } });

    const req = suite.createErpRequest({
      url: "http://localhost:3000/api/datasource",
      method: "POST",
      bearer: "token-default",
      body: JSON.stringify(body),
      contentType: "application/json",
      cookie: "JSESSIONID=abc123; other=1",
    });

    // Import the route after mocks
    const { POST } = await import("@/app/api/datasource/route");

    // Act
    const res = await POST(req as any);

    // Assert response
    expect(res).toBeDefined();
    expect(res.status).toBe(200);

    // Inspect fetch call headers: Cookie should be present and include browser cookie
    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Cookie).toContain("JSESSIONID=abc123");
  });
});
