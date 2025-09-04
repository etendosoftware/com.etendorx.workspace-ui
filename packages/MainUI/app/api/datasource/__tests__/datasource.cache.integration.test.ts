import {
  createDatasourceTestSuite,
  captureCacheKey,
  mockFetchFactory,
} from "@/app/api/_test-utils/datasource-test-utils";

// Ensure shouldCacheDatasource returns true for this test
jest.mock("@/app/api/_utils/datasourceCache", () => ({
  shouldCacheDatasource: jest.fn(() => true),
}));

const suite = createDatasourceTestSuite("BFF /api/datasource - cache integration", "default");

suite.describe(() => {
  test("DS-READ-02: cache key composition includes token, entity and params", async () => {
    // Mock session store functions
    const { setErpSessionCookie } = await import("@/app/api/_utils/sessionStore");
    setErpSessionCookie("token-default", {
      cookieHeader: "JSESSIONID=test-session",
      csrfToken: "test-csrf-token",
    });

    const spy = jest.fn();
    captureCacheKey(spy);

    // Arrange: mock fetch to return a valid response
    (global.fetch as jest.Mock) = mockFetchFactory({ status: 200, json: { response: { status: 0 } } });

    // Create request for entity Product
    const req = suite.createRequest("token-default", { entity: "Product", params: {} });

    // Import handler after mocks
    const { POST } = await import("@/app/api/datasource/route");

    // Act: invoke handler which should call the cached function
    const res = await POST(req as any);

    expect(res).toBeDefined();
    expect(res.status).toBe(200);

    // Assert: captureCacheKey spy was called and args include token and entity
    expect(spy).toHaveBeenCalled();
    const calledArgs = spy.mock.calls[0][0];
    // calledArgs should be an array [userToken, entity, params]
    expect(Array.isArray(calledArgs)).toBe(true);
    expect(calledArgs[0]).toBe("token-default");
    expect(calledArgs[1]).toBe("Product");
    expect(typeof calledArgs[2]).toBe("object");

    // Also ensure fetch called once
    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
