import { createDatasourceTestSuite, assertDatasourceCall } from "@/app/api/_test-utils/datasource-test-utils";

const suite = createDatasourceTestSuite("BFF /api/datasource - read integration", "default");

suite.describe(() => {
  test("DS-READ-01: builds form-urlencoded and forwards to ERP with correct headers", async () => {
    const req = suite.createRequest("token-default", { entity: "Customer", params: { _startRow: 0 } });

    // Import the route after mocks are installed to avoid importing next/server before jest.mock is set up
    const { POST } = await import("@/app/api/datasource/route");

    const res = await POST(req as any);

    // Expect NextResponse-like object
    expect(res).toBeDefined();
    expect(res.status).toBe(200);

    const expectedUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/Customer`;

    assertDatasourceCall(
      expectedUrl,
      {
        Authorization: `Bearer token-default`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      { _startRow: "0" }
    );
  });
});
