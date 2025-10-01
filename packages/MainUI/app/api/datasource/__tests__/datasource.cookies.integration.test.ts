import { createDatasourceTestSuite, mockFetchFactory } from "@/app/api/_test-utils/datasource-test-utils";

const suite = createDatasourceTestSuite("BFF /api/datasource - cookie policy integration", "default");

suite.describe(() => {
  const cases = [
    {
      env: "false",
      shouldForward: false,
      name: "COOKIE-01: ERP_FORWARD_COOKIES=false should NOT forward browser cookies to ERP",
    },
    {
      env: "true",
      shouldForward: true,
      name: "COOKIE-02: ERP_FORWARD_COOKIES=true should forward browser cookies to ERP",
    },
  ];

  test.each(cases)("$name", async ({ env, shouldForward }) => {
    // Mock session store functions
    const { setErpSessionCookie } = await import("@/app/api/_utils/sessionStore");
    setErpSessionCookie("token-default", {
      cookieHeader: "JSESSIONID=test-session",
      csrfToken: "test-csrf-token",
    });

    // Arrange
    process.env.ERP_FORWARD_COOKIES = env;

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

    // Inspect fetch call headers
    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];

    if (shouldForward) {
      expect(init.headers.Cookie).toContain("JSESSIONID=abc123");
    } else {
      expect(init.headers.Cookie).toBeUndefined();
    }
  });
});
