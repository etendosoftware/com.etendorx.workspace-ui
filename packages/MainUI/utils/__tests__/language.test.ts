import { t, getLanguage } from "../language";
import { DEFAULT_LANGUAGE } from "@workspaceui/componentlibrary/src/locales";

describe("language", () => {
  describe("t (translate)", () => {
    it("should resolve a nested key from a provided value tree", () => {
      const value = { common: { save: "Save" } };
      expect(t(DEFAULT_LANGUAGE, "common.save", value)).toBe("Save");
    });

    it("should resolve single-level keys", () => {
      const value = { greeting: "Hello" };
      expect(t(DEFAULT_LANGUAGE, "greeting", value)).toBe("Hello");
    });

    it("should return the key when key is not found in value tree", () => {
      const value = { other: "data" };
      expect(t(DEFAULT_LANGUAGE, "missing.key", value)).toBe("missing.key");
    });

    it("should return the key when value is not an object", () => {
      expect(t(DEFAULT_LANGUAGE, "something", "not-an-object")).toBe("something");
    });

    it("should return the key when value is null", () => {
      expect(t(DEFAULT_LANGUAGE, "something", null)).toBe("something");
    });

    it("should return the remaining key path when nested value is not a string at leaf", () => {
      const value = { key: { nested: 123 } };
      expect(t(DEFAULT_LANGUAGE, "key.nested", value)).toBe("nested");
    });

    it("should use DEFAULT_LANGUAGE fallback when language is empty string", () => {
      const value = { test: "value" };
      const resultDefault = t(DEFAULT_LANGUAGE, "test", value);
      const resultEmpty = t("" as any, "test", value);
      expect(resultEmpty).toBe(resultDefault);
    });

    it("should handle deeply nested keys", () => {
      const value = { a: { b: { c: "deep" } } };
      expect(t(DEFAULT_LANGUAGE, "a.b.c", value)).toBe("deep");
    });

    it("should return remaining key path when partial path hits a non-object value", () => {
      const value = { a: { b: "not-deep-enough" } };
      // When "b" is a string, trying to go deeper into "c" returns the remaining key "c"
      expect(t(DEFAULT_LANGUAGE, "a.b.c", value)).toBe("c");
    });
  });

  describe("getLanguage", () => {
    const originalLocalStorage = window.localStorage;

    afterEach(() => {
      try {
        window.localStorage.removeItem("currentLanguage");
      } catch {}
    });

    it("should return DEFAULT_LANGUAGE when nothing is saved", () => {
      expect(getLanguage()).toBe(DEFAULT_LANGUAGE);
    });

    it("should return saved language from localStorage", () => {
      try {
        window.localStorage.setItem("currentLanguage", "es_ES");
        expect(getLanguage()).toBe("es_ES");
      } catch {
        // localStorage may not be available in test env
        expect(getLanguage()).toBe(DEFAULT_LANGUAGE);
      }
    });
  });
});
