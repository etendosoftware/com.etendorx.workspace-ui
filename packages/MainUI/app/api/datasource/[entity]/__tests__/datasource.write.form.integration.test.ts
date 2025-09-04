import { createDatasourceTestSuite, mockFetchFactory } from "@/app/api/_test-utils/datasource-test-utils";

const suite = createDatasourceTestSuite("BFF /api/datasource/:entity - write form mapping integration", "default");

suite.describe(() => {
  test("DS-WRITE-02: standard form mapping forwards form-urlencoded body", async () => {
    // Mock session store functions
    const { setErpSessionCookie } = await import("@/app/api/_utils/sessionStore");
    setErpSessionCookie("token-default", {
      cookieHeader: "JSESSIONID=test-session",
      csrfToken: "test-csrf-token",
    });

    const formBody = "field1=value1&field2=value2";
    (global.fetch as jest.Mock) = mockFetchFactory({ status: 200, json: { ok: true } });

    const req = suite.createErpRequest({
      url: "http://localhost:3000/api/datasource/Invoice",
      method: "POST",
      bearer: "token-default",
      body: formBody,
      contentType: "application/x-www-form-urlencoded",
    });

    const { POST } = await import("@/app/api/datasource/[entity]/route");

    const res = await POST(req as any, { params: { entity: "Invoice" } } as any);

    expect(res).toBeDefined();
    expect(res.status).toBe(200);

    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [dest, init] = fetchMock.mock.calls[0];
    const expectedUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/Invoice`;
    expect(String(dest)).toBe(expectedUrl);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(init.body).toBe(`${formBody}&csrfToken=test-csrf-token`);
  });
});
