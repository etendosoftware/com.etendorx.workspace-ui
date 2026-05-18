import { logCurl } from "../utils";

describe("logCurl", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs a basic GET request", () => {
    logCurl("https://example.com/api", "GET", {}, null);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("curl -X GET 'https://example.com/api'");
  });

  it("logs a POST request with headers", () => {
    logCurl("https://example.com/api", "POST", { "Content-Type": "application/json" }, null);
    expect(consoleSpy.mock.calls[0][0]).toContain("-H 'Content-Type: application/json'");
  });

  it("skips standard headers", () => {
    logCurl("https://example.com/api", "GET", { host: "example.com", connection: "keep-alive" }, null);
    const output = consoleSpy.mock.calls[0][0];
    expect(output).not.toContain("host");
    expect(output).not.toContain("connection");
  });

  it("includes JSON body", () => {
    logCurl("https://example.com/api", "POST", {}, { key: "value" });
    expect(consoleSpy.mock.calls[0][0]).toContain("--data-raw");
    expect(consoleSpy.mock.calls[0][0]).toContain("key");
  });

  it("includes string body", () => {
    logCurl("https://example.com/api", "POST", {}, "raw body text");
    expect(consoleSpy.mock.calls[0][0]).toContain("raw body text");
  });

  it("includes URLSearchParams body", () => {
    const params = new URLSearchParams({ a: "1", b: "2" });
    logCurl("https://example.com/api", "POST", {}, params);
    expect(consoleSpy.mock.calls[0][0]).toContain("a=1");
  });

  it("handles Headers instance", () => {
    const headers = new Headers({ Authorization: "Bearer token123" });
    logCurl("https://example.com/api", "GET", headers, null);
    expect(consoleSpy.mock.calls[0][0]).toContain("authorization: Bearer token123");
  });
});
