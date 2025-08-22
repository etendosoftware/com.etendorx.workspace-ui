import { createDatasourceTestSuite, mockFetchFactory } from "@/app/api/_test-utils/datasource-test-utils";

const suite = createDatasourceTestSuite("BFF /api/datasource - error propagation", "default");

suite.describe(() => {
  test("DS-READ-03: propagates 4xx/5xx from ERP to client", async () => {
    // Arrange: ERP responds with 401 and an error body
    const erpBody = { error: "Unauthorized" };
    (global.fetch as jest.Mock) = mockFetchFactory({ status: 401, json: erpBody });

    const req = suite.createRequest("token-default", { entity: "Customer", params: { _startRow: 0 } });

    const { POST } = await import("@/app/api/datasource/route");

    // Act
    const res = await POST(req);

    // Assert: handler propagates status and body
    expect(res).toBeDefined();
    expect(res.status).toBe(401);

    const json = await res.body;
    // Depending on NextResponse mock, body may be in res.body (as set in test utils)
    // In our test-utils NextResponse.json returns { ok: true, status, body }
    expect(json).toBeDefined();
    // The ERP mock returns { error: 'Unauthorized' } as JSON - handler should propagate or wrap - assert presence
    if (json && typeof json === "object") {
      expect(json.error || json.response?.error).toBeDefined();
    }
  });
});
