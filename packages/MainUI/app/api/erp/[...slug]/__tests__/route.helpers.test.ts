/**
 * Tests for helper functions in the ERP route handler
 * These functions handle encoding detection, content type detection, and HTML rewriting
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
    });

    it("should detect PDF as binary", () => {
      expect(isBinaryContentType("application/pdf")).toBe(true);
    });

    it("should not detect text as binary", () => {
      expect(isBinaryContentType("text/html")).toBe(false);
      expect(isBinaryContentType("application/json")).toBe(false);
    });
  });

  describe("createHtmlResponse", () => {
    it("should set UTF-8 charset if missing", () => {
      const original = new Response("<html></html>", {
        headers: { "Content-Type": "text/html" },
      });
      const response = createHtmlResponse("<html>rewritten</html>", original);
      expect(response.headers.get("Content-Type")).toBe("text/html; charset=UTF-8");
    });

    it("should preserve existing headers", () => {
      const original = new Response("<html></html>", {
        headers: { "X-Custom": "test", "Content-Type": "text/html" },
      });
      const response = createHtmlResponse("<html>rewritten</html>", original);
      expect(response.headers.get("X-Custom")).toBe("test");
    });
  });

  describe("rewriteHtmlResourceUrls", () => {
    const baseUrl = "http://localhost:8080/etendo";

    it("should inject <base> tag pointing to baseUrl with trailing slash", () => {
      const html = "<html><head><title>Test</title></head><body></body></html>";
      const result = rewriteHtmlResourceUrls(html, baseUrl);
      expect(result).toContain(`<base href="${baseUrl}/" />`);
    });

    it("should convert absolute paths /web/ to relative web/ so <base> takes effect", () => {
      const html = '<script src="/web/js/utils.js"></script>';
      const result = rewriteHtmlResourceUrls(html, baseUrl);
      // Should replace /web/ with web/
      expect(result).toContain('src="web/js/utils.js"');
      // Should NOT contain the absolute path anymore
      expect(result).not.toContain('src="/web/js/utils.js"');
    });

    it("should convert relative traversal ../web/ to simple relative web/", () => {
      const html = '<link href="../web/skins/style.css" />';
      const result = rewriteHtmlResourceUrls(html, baseUrl);
      // Should replace ../web/ with web/
      expect(result).toContain('href="web/skins/style.css"');
      expect(result).not.toContain('href="../web/skins/style.css"');
    });

    it("should handle org.openbravo paths", () => {
      const html = '<script src="/org.openbravo.client.kernel/js"></script>';
      const result = rewriteHtmlResourceUrls(html, baseUrl);
      expect(result).toContain('src="org.openbravo.client.kernel/js"');
    });

    it("should handle ad_forms paths", () => {
      const html = '<iframe src="/ad_forms/myform.html"></iframe>';
      const result = rewriteHtmlResourceUrls(html, baseUrl);
      expect(result).toContain('src="ad_forms/myform.html"');
    });

    it("should strip /etendo/ origin context entirely to let <base> handle it or replace with full url", () => {
      // Our logic for /etendo/ is that if it finds src="/etendo/", it rewrites it to full absolute URL using origin
      const html = '<script src="/etendo/web/js/utils.js"></script>';
      const result = rewriteHtmlResourceUrls(html, baseUrl);
      // Logic: rewritten.replace(/(href|src)\s*=\s*([\"'])\/etendo\//gi, `$1=$2${origin}/etendo/`);
      // Origin of http://localhost:8080/etendo is http://localhost:8080
      // So result should be http://localhost:8080/etendo/
      expect(result).toContain('src="http://localhost:8080/etendo/web/js/utils.js"');
    });

    it("should treat nested ../../web/ same as ../web/", () => {
      const html = '<script src="../../web/js/deep.js"></script>';
      const result = rewriteHtmlResourceUrls(html, baseUrl);
      expect(result).toContain('src="web/js/deep.js"');
    });
  });
});
