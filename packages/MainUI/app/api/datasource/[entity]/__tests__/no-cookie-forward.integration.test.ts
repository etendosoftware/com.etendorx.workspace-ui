/**
 * When ERP_FORWARD_COOKIES=false, the save/update proxy must NOT forward Cookie header to ERP.
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ ok: true, status: init?.status ?? 200, body }),
  },
}));

jest.mock("@/lib/auth", () => ({
  extractBearerToken: jest.fn().mockReturnValue("token-nocookie-entity"),
}));

import { POST } from "../route";
import { createMockApiRequest, setupApiTestEnvironment } from "../../../_test-utils/api-test-utils";

describe("Datasource [entity] save does not forward Cookie when ERP_FORWARD_COOKIES=false", () => {
  setupApiTestEnvironment();
  beforeEach(() => {
    process.env.ERP_FORWARD_COOKIES = "false";
  });

  it("omits Cookie header in ERP forward", async () => {
    const url = "http://localhost:3000/api/datasource/Invoice?windowId=10&tabId=20&_operationType=add";
    const payload = { dataSource: "Invoice", operationType: "add", data: { id: "1" } };
    const req = createMockApiRequest({
      url,
      method: "POST",
      bearer: "token-nocookie-entity",
      jsonBody: payload,
      contentType: "application/json; charset=utf-8",
      cookies: { JSESSIONID: "abc" },
    });
    const res: any = await POST(req as any, { params: { entity: "Invoice" } } as any);
    expect(res.status).toBe(200);
    const [_dest, init] = (global as any).fetch.mock.calls[0];
    expect(init.headers["Authorization"]).toBe("Bearer token-nocookie-entity");
    expect(init.headers["Cookie"]).toBeUndefined();
  });
});
