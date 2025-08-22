import { createDatasourceTestSuite, mockFetchFactory } from "@/app/api/_test-utils/datasource-test-utils";

const suite = createDatasourceTestSuite("BFF /api/datasource/:entity - CSRF forwarding", "default");

suite.describe(() => {
  test("DS-WRITE-03: forwards X-CSRF-Token header to ERP", async () => {
    (global.fetch as jest.Mock) = mockFetchFactory({ status: 200, json: { ok: true } });

    const req = suite.createErpRequest({
      url: "http://localhost:3000/api/datasource/Invoice",
      method: "POST",
      bearer: "token-default",
      body: JSON.stringify({ some: "payload" }),
      contentType: "application/json",
    });

    // Manually add X-CSRF-Token header to request mock
    // Capture the original getter to avoid recursive delegation when overriding
    const originalGet = (req as any).headers.get.bind((req as any).headers);
    (req as any).headers.get = (k: string) => {
      if (k === "X-CSRF-Token") return "csrf-123";
      return originalGet(k);
    };

    const { POST } = await import("@/app/api/datasource/[entity]/route");

    const res = await POST(req as any, { params: { entity: "Invoice" } } as any);

    expect(res).toBeDefined();
    expect(res.status).toBe(200);

    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["X-CSRF-Token"]).toBe("csrf-123");
  });
});
