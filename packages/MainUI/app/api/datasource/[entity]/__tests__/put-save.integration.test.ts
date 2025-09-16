/**
 * Integration-like test: Datasource save with PUT + JSON body should convert to form-url-encoded.
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { PUT } from "../route";
import { createMockApiRequest, setupApiTestEnvironment } from "../../../_test-utils/api-test-utils";
import { setErpSessionCookie } from "@/app/api/_utils/sessionStore";
import { getExpectedDatasourceUrl } from "../../../_test-utils/endpoint-test-utils";

describe("Save via PUT JSON→form conversion", () => {
  // Configura entorno y fetch mock una vez para este archivo
  setupApiTestEnvironment();

  it("encodes JSON to form-urlencoded on PUT", async () => {
    const BEARER_TOKEN = "put-token";
    setErpSessionCookie(BEARER_TOKEN, {
      cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
      csrfToken: "CSRF-TEST-123",
    });
    const url = "http://localhost:3000/api/datasource/Invoice?windowId=1&tabId=2&_operationType=update";
    const body = {
      dataSource: "isc_OBViewDataSource_0",
      operationType: "update",
      componentId: "isc_OBViewForm_0",
      csrfToken: "PUT-123",
      data: { docNo: "100", note: "hello" },
      oldValues: { docNo: "99" },
    };
    const req = createMockApiRequest({
      url,
      bearer: BEARER_TOKEN,
      jsonBody: body,
      method: "PUT",
      contentType: "application/json; charset=utf-8",
    });
    const res: any = await PUT(req, { params: { entity: "Invoice" } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe(
      getExpectedDatasourceUrl("Invoice", "update", {
      windowId: "1",
      tabId: "2",
      _operationType: "update"
    })
    );
    expect(init.method).toBe("PUT");
    expect(init.headers.Authorization).toBe(`Bearer ${BEARER_TOKEN}`);
    expect(init.headers["Content-Type"]).toBe("application/json; charset=utf-8");
    const decoded = decodeURIComponent(init.body as string);
    expect(decoded).toContain('"operationType":"update"');
    expect(decoded).toContain('"dataSource":"isc_OBViewDataSource_0"');
    expect(decoded).toContain('"data"');
    expect(decoded).toContain('"oldValues"');
  });
});
