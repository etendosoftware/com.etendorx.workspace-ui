/**
 * Integration-like test: Datasource save with special/Unicode characters in payload.
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

import { POST } from "../route";
import { createMockApiRequest, setupApiTestEnvironment } from "../../../_test-utils/api-test-utils";

describe("Save with special/Unicode fields", () => {
  // Configura entorno y fetch mock una vez para este archivo
  setupApiTestEnvironment();

  it("encodes UTF-8 content correctly in form body", async () => {
    const url =
      "http://localhost:3000/api/datasource/OrderLine?windowId=143&tabId=187&_operationType=add&language=es_ES";
    const body = {
      dataSource: "isc_OBViewDataSource_0",
      operationType: "add",
      componentId: "isc_OBViewForm_0",
      csrfToken: "CSRF-Üñîçødé-🙂",
      data: {
        description: "España – Región Norte ☕️",
        productName: "Agua sin Gas 1L",
        currencySymbol: "€",
      },
      oldValues: {},
    };

    const req = createMockApiRequest({
      url,
      bearer: "Bearer-Token-UNICODE",
      jsonBody: body,
      method: "POST",
      contentType: "application/json; charset=utf-8",
    });
    const res: any = await POST(req, { params: { entity: "OrderLine" } } as any);
    expect(res.status).toBe(200);

    const [dest, init] = (global as any).fetch.mock.calls[0];
    expect(String(dest)).toBe(
      "http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/OrderLine?windowId=143&tabId=187&_operationType=add&language=es_ES"
    );
    expect(init.headers.Authorization).toBe("Bearer Bearer-Token-UNICODE");
    expect(init.headers["Content-Type"]).toBe("application/json; charset=utf-8");
    const decoded = decodeURIComponent(init.body as string);
    // Spaces may be encoded as '+' in URL encoding; accept both forms
    expect(decoded.replace(/\+/g, " ")).toContain("España – Región Norte ☕️");
    expect(decoded).toContain("€");
  });
});
