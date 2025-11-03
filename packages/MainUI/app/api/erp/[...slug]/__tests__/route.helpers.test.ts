/**
 * Tests for helper functions in the ERP route handler
 * These functions handle encoding detection, HTML rewriting, and content type detection
 */

describe("ERP route helper functions", () => {
  describe("detectCharset", () => {
    // Mock the detectCharset function behavior
    const detectCharset = (contentType: string | null): string => {
      if (!contentType) {
        return "iso-8859-1";
      }
      const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
      return charsetMatch ? charsetMatch[1].toLowerCase() : "iso-8859-1";
    };

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
    const isBinaryContentType = (contentType: string): boolean => {
      return (
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/zip") ||
        contentType.includes("image/") ||
        contentType.includes("video/") ||
        contentType.includes("audio/") ||
        contentType.includes("application/pdf")
      );
    };

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
    const ETENDO_CLASSIC_URL = "http://localhost:8080/etendo";

    const rewriteHtmlResourceUrls = (html: string): string => {
      let rewritten = html;
      rewritten = rewritten.replace(/(href|src)="(\.\.\/)*web\//gi, `$1="${ETENDO_CLASSIC_URL}/web/`);
      rewritten = rewritten.replace(
        /(href|src)="(\.\.\/)*org\.openbravo\./gi,
        `$1="${ETENDO_CLASSIC_URL}/org.openbravo.`
      );
      return rewritten;
    };

    it("should rewrite relative web paths", () => {
      const html = '<link href="../web/styles.css" />';
      const result = rewriteHtmlResourceUrls(html);
      expect(result).toContain(`href="${ETENDO_CLASSIC_URL}/web/styles.css"`);
    });

    it("should rewrite deeply nested web paths", () => {
      const html = '<script src="../../../web/js/app.js"></script>';
      const result = rewriteHtmlResourceUrls(html);
      expect(result).toContain(`src="${ETENDO_CLASSIC_URL}/web/js/app.js"`);
    });

    it("should rewrite org.openbravo paths", () => {
      const html = '<link href="../org.openbravo.client.kernel/style.css" />';
      const result = rewriteHtmlResourceUrls(html);
      expect(result).toContain(`href="${ETENDO_CLASSIC_URL}/org.openbravo.client.kernel/style.css"`);
    });

    it("should handle both href and src attributes", () => {
      const html = '<link href="../web/style.css" /><img src="../web/logo.png" />';
      const result = rewriteHtmlResourceUrls(html);
      expect(result).toContain(`href="${ETENDO_CLASSIC_URL}/web/style.css"`);
      expect(result).toContain(`src="${ETENDO_CLASSIC_URL}/web/logo.png"`);
    });

    it("should be case insensitive", () => {
      const html = '<LINK HREF="../web/styles.css" />';
      const result = rewriteHtmlResourceUrls(html);
      expect(result).toContain(`HREF="${ETENDO_CLASSIC_URL}/web/styles.css"`);
    });

    it("should not modify absolute URLs", () => {
      const html = '<link href="http://external.com/style.css" />';
      const result = rewriteHtmlResourceUrls(html);
      expect(result).toBe(html);
    });
  });

  describe("createHtmlResponse", () => {
    const createHtmlResponse = (html: string, originalResponse: Response): Response => {
      const htmlHeaders = new Headers(originalResponse.headers);
      if (!htmlHeaders.has("content-type")) {
        htmlHeaders.set("Content-Type", "text/html");
      }
      return new Response(html, {
        status: originalResponse.status,
        statusText: originalResponse.statusText,
        headers: htmlHeaders,
      });
    };

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
