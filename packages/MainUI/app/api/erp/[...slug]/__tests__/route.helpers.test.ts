/**
 * Tests for helper functions in the ERP route handler
 * These functions handle encoding detection and content type detection
 *
 * Note: HTML rewriting functions were removed as the About modal now loads directly from Classic
 */

import { detectCharset, isBinaryContentType } from "../route.helpers";

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
});
