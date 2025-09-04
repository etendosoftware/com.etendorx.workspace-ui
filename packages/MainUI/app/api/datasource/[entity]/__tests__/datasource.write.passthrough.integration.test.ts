import {
  createDatasourceTestSuite,
  mockFetchFactory,
  assertDatasourceCall,
} from "@/app/api/_test-utils/datasource-test-utils";

const suite = createDatasourceTestSuite("BFF /api/datasource/:entity - write passthrough integration", "default");

suite.describe(() => {
  test("DS-WRITE-01: JSON passthrough when isc_dataFormat=json", async () => {
    // Mock session store functions
    const { setErpSessionCookie } = await import("@/app/api/_utils/sessionStore");
    setErpSessionCookie("token-default", {
      cookieHeader: "JSESSIONID=test-session",
      csrfToken: "test-csrf-token",
    });

    // Arrange: install fetch mock that returns 201 and echoes body
    const body = { operationType: "add", data: { id: 1, qty: 2 } };
    (global.fetch as jest.Mock) = mockFetchFactory({ status: 201, json: body });

    // Create request to /api/datasource/Order?isc_dataFormat=json
    const req = suite.createErpRequest({
      url: "http://localhost:3000/api/datasource/Order?isc_dataFormat=json",
      method: "POST",
      bearer: "token-default",
      body: JSON.stringify(body),
      contentType: "application/json",
    });

    // Import handler after mocks
    const { POST } = await import("@/app/api/datasource/[entity]/route");

    // Act
    const res = await POST(req as any, { params: { entity: "Order" } } as any);

    // Assert response status forwarded
    expect(res).toBeDefined();
    expect(res.status).toBe(201);

    // Assert fetch called with JSON body and content-type application/json
    const expectedUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/Order?isc_dataFormat=json`;

    assertDatasourceCall(
      expectedUrl,
      {
        Authorization: `Bearer token-default`,
        "Content-Type": "application/json",
      },
      {} // no form params to assert
    );
  });
});
