import { isSafeUrl, isUrlParam } from "../urlSafety";

describe("urlSafety", () => {
  describe("isSafeUrl", () => {
    it("should accept valid https URLs", () => {
      expect(isSafeUrl("https://example.com")).toBe(true);
      expect(isSafeUrl("https://example.com/path?q=1")).toBe(true);
      expect(isSafeUrl("https://sub.domain.example.com")).toBe(true);
    });

    it("should reject http URLs", () => {
      expect(isSafeUrl("http://example.com")).toBe(false);
    });

    it("should reject javascript: and data: URLs", () => {
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeUrl("data:text/html,<h1>hi</h1>")).toBe(false);
    });

    it("should reject URLs with userinfo (user:pass@)", () => {
      expect(isSafeUrl("https://user:pass@example.com")).toBe(false);
      expect(isSafeUrl("https://user@example.com")).toBe(false);
    });

    it("should reject localhost and private IPs", () => {
      expect(isSafeUrl("https://localhost")).toBe(false);
      expect(isSafeUrl("https://127.0.0.1")).toBe(false);
      expect(isSafeUrl("https://10.0.0.1")).toBe(false);
      expect(isSafeUrl("https://172.16.0.1")).toBe(false);
      expect(isSafeUrl("https://192.168.1.1")).toBe(false);
      expect(isSafeUrl("https://169.254.169.254")).toBe(false);
    });

    it("should reject IPv6 loopback and ULA", () => {
      expect(isSafeUrl("https://[::1]")).toBe(false);
      expect(isSafeUrl("https://[fc00::1]")).toBe(false);
    });

    it("should return false for invalid URLs", () => {
      expect(isSafeUrl("not-a-url")).toBe(false);
      expect(isSafeUrl("")).toBe(false);
    });

    it("should trim whitespace before parsing", () => {
      expect(isSafeUrl("  https://example.com  ")).toBe(true);
    });
  });

  describe("isUrlParam", () => {
    it("should detect URL params by name", () => {
      expect(isUrlParam({ name: "url", defaultValue: null })).toBe(true);
      expect(isUrlParam({ name: "src", defaultValue: null })).toBe(true);
      expect(isUrlParam({ name: "imageUrl", defaultValue: null })).toBe(true);
      expect(isUrlParam({ name: "icon_src", defaultValue: null })).toBe(true);
    });

    it("should detect URL params by defaultValue starting with http", () => {
      expect(isUrlParam({ name: "widget", defaultValue: "https://example.com" })).toBe(true);
      expect(isUrlParam({ name: "widget", defaultValue: "http://example.com" })).toBe(true);
    });

    it("should not flag non-URL params", () => {
      expect(isUrlParam({ name: "title", defaultValue: null })).toBe(false);
      expect(isUrlParam({ name: "description", defaultValue: "some text" })).toBe(false);
    });

    it("should handle case insensitivity for defaultValue", () => {
      expect(isUrlParam({ name: "x", defaultValue: "HTTPS://EXAMPLE.COM" })).toBe(true);
    });
  });
});
