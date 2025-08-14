/**
 * Integration-like test for kernelClient base forward path.
 */

import { Metadata } from "../metadata";

describe("api-client: Metadata.kernelClient forward base", () => {
  const origWindow: any = global.window;
  const origFetch: any = global.fetch;

  beforeAll(() => {
    // Ensure URL exists in this test env
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeUrl = require("url");
    (global as any).URL = nodeUrl.URL;
    (global as any).window = { location: { origin: "http://localhost:3000" } } as any;
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json; charset=utf-8" },
      json: async () => ({}),
      text: async () => "{}",
      arrayBuffer: async () => new TextEncoder().encode("{}").buffer,
    });
  });

  afterAll(() => {
    (global as any).window = origWindow;
    (global as any).fetch = origFetch;
  });

  it("posts to /api/erp/meta/forward/org.openbravo.client.kernel?...", async () => {
    Metadata.setBaseUrl("http://localhost:3000");
    Metadata.setToken("tkn");
    await Metadata.kernelClient.post(
      "?MODE=NEW&TAB_ID=186&_action=org.openbravo.client.application.window.FormInitializationComponent"
    );
    expect((global as any).fetch).toHaveBeenCalled();
    const url = String((global as any).fetch.mock.calls[0][0]);
    // Trailing slash normalization is fine; accept both forms
    expect(url.replace("/org.openbravo.client.kernel/", "/org.openbravo.client.kernel")).toBe(
      "http://localhost:3000/api/erp/meta/forward/org.openbravo.client.kernel/?MODE=NEW&TAB_ID=186&_action=org.openbravo.client.application.window.FormInitializationComponent"
    );
  });
});
