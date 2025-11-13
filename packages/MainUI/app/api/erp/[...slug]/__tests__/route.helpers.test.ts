/**
 * Tests for helper functions in the ERP route handler
 * These functions handle encoding detection, HTML rewriting, and content type detection
 */

import { detectCharset, isBinaryContentType, rewriteHtmlResourceUrls, createHtmlResponse } from "../route.helpers";

describe("ERP route helper functions", () => {
  describe("detectCharset", () => {
    it("should return iso-8859-1 when contentType is null", () => {
      expect(detectCharset(null)).toBe("iso-8859-1");
    });

    it("should extract charset from content-type header", () => {
      expect(detectCharset("text/html; charset=utf-8")).toBe("utf-8");
    });

    it("should handle charset in different positions", () => {
      expect(detectCharset("charset=utf-8; text/html")).toBe("utf-8");
    });

    it("should be case insensitive", () => {
      expect(detectCharset("text/html; CHARSET=UTF-8")).toBe("utf-8");
    });

    it("should return iso-8859-1 when no charset is specified", () => {
      expect(detectCharset("text/html")).toBe("iso-8859-1");
    });

    it("should handle windows-1252 charset", () => {
      expect(detectCharset("text/html; charset=windows-1252")).toBe("windows-1252");
    });
  });

  describe("isBinaryContentType", () => {
    it("should detect octet-stream as binary", () => {
      expect(isBinaryContentType("application/octet-stream")).toBe(true);
    });

    it("should detect zip as binary", () => {
      expect(isBinaryContentType("application/zip")).toBe(true);
    });

    it("should detect images as binary", () => {
      expect(isBinaryContentType("image/png")).toBe(true);
      expect(isBinaryContentType("image/jpeg")).toBe(true);
      expect(isBinaryContentType("image/gif")).toBe(true);
    });

    it("should detect videos as binary", () => {
      expect(isBinaryContentType("video/mp4")).toBe(true);
    });

    it("should detect audio as binary", () => {
      expect(isBinaryContentType("audio/mpeg")).toBe(true);
    });

    it("should detect PDF as binary", () => {
      expect(isBinaryContentType("application/pdf")).toBe(true);
    });

    it("should not detect text as binary", () => {
      expect(isBinaryContentType("text/html")).toBe(false);
      expect(isBinaryContentType("application/json")).toBe(false);
    });
  });

  describe("rewriteHtmlResourceUrls", () => {
    // In production, ETENDO_CLASSIC_HOST would be used (e.g., http://localhost:8080/etendo)
    // This is the browser-accessible URL for legacy resources
    const ETENDO_CLASSIC_HOST = "http://localhost:8080/etendo";

    it("should rewrite relative web paths", () => {
      const html = '<link href="../web/styles.css" />';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain(`href="${ETENDO_CLASSIC_HOST}/web/styles.css"`);
    });

    it("should rewrite deeply nested web paths", () => {
      const html = '<script src="../../../web/js/app.js"></script>';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain(`src="${ETENDO_CLASSIC_HOST}/web/js/app.js"`);
    });

    it("should rewrite org.openbravo paths", () => {
      const html = '<link href="../org.openbravo.client.kernel/style.css" />';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain(`href="${ETENDO_CLASSIC_HOST}/org.openbravo.client.kernel/style.css"`);
    });

    it("should handle both href and src attributes", () => {
      const html = '<link href="../web/style.css" /><img src="../web/logo.png" />';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain(`href="${ETENDO_CLASSIC_HOST}/web/style.css"`);
      expect(result).toContain(`src="${ETENDO_CLASSIC_HOST}/web/logo.png"`);
    });

    it("should be case insensitive", () => {
      const html = '<LINK HREF="../web/styles.css" />';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain(`HREF="${ETENDO_CLASSIC_HOST}/web/styles.css"`);
    });

    it("should not modify absolute URLs", () => {
      const html = '<link href="http://external.com/style.css" />';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toBe(html);
    });

    it("should rewrite absolute web paths", () => {
      const html = '<link href="/web/styles.css" />';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain(`href="${ETENDO_CLASSIC_HOST}/web/styles.css"`);
    });

    it("should rewrite absolute org.openbravo paths", () => {
      const html = '<script src="/org.openbravo.client.kernel/app.js"></script>';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain(`src="${ETENDO_CLASSIC_HOST}/org.openbravo.client.kernel/app.js"`);
    });

    it("should rewrite absolute ad_forms paths", () => {
      const html = '<link href="/ad_forms/styles.css" />';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain(`href="${ETENDO_CLASSIC_HOST}/ad_forms/styles.css"`);
    });

    it("should rewrite relative ad_forms paths", () => {
      const html = '<script src="../../ad_forms/script.js"></script>';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain(`src="${ETENDO_CLASSIC_HOST}/ad_forms/script.js"`);
    });

    it("should add base tag to HTML head", () => {
      const html = "<html><head><title>Test</title></head><body></body></html>";
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      expect(result).toContain('<base href="http://localhost:8080/etendo/" />');
      expect(result).toMatch(/<head[^>]*>\s*<base href="http:\/\/localhost:8080\/etendo\/" \/>/);
    });

    it("should not add base tag if already present", () => {
      const html = '<html><head><base href="http://example.com/" /><title>Test</title></head><body></body></html>';
      const result = rewriteHtmlResourceUrls(html, ETENDO_CLASSIC_HOST);
      // Should only have one base tag
      const baseTagCount = (result.match(/<base/g) || []).length;
      expect(baseTagCount).toBe(1);
    });
  });

  describe("createHtmlResponse", () => {
    it("should create response with HTML content", () => {
      const originalResponse = new Response("", {
        status: 200,
        statusText: "OK",
        headers: new Headers(),
      });

      const result = createHtmlResponse("<html></html>", originalResponse);

      expect(result.status).toBe(200);
      expect(result.headers.get("content-type")).toBe("text/html");
    });

    it("should preserve existing content-type if present", () => {
      const originalResponse = new Response("", {
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
      });

      const result = createHtmlResponse("<html></html>", originalResponse);

      expect(result.headers.get("content-type")).toBe("text/html; charset=utf-8");
    });

    it("should preserve status code", () => {
      const originalResponse = new Response("", {
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
      });

      const result = createHtmlResponse("<html>404</html>", originalResponse);

      expect(result.status).toBe(404);
      // Note: statusText may not be preserved in all environments
    });
  });
});
