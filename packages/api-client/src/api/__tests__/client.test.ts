import { Client } from "../client";

describe("Client URL building", () => {
  const originalWindow = global.window as any;

  beforeAll(() => {
    // Ensure WHATWG URL is available in test environment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeUrl = require("url");
    (global as any).URL = nodeUrl.URL;
    (global as any).window = { location: { origin: "http://localhost:3000" } };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json; charset=utf-8" },
      json: async () => ({}),
      text: async () => "{}",
      arrayBuffer: async () => new TextEncoder().encode("{}").buffer,
    });
  });

  afterAll(() => {
    (global as any).window = originalWindow;
    (global as any).fetch = undefined;
  });

  it("prefixes 'api/..' with '/' to avoid attaching to base", async () => {
    const client = new Client();
    client.setBaseUrl("http://localhost:3000/api/erp/meta/forward/org.openbravo.service.datasource/");

    await client.request("api/datasource");

    expect((global as any).fetch).toHaveBeenCalled();
    const url = (global as any).fetch.mock.calls[0][0].toString();
    // Should call app route, not forward base
    expect(url).toContain("/api/datasource");
  });
});
