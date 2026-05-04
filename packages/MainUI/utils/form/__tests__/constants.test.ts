import {
  PASSWORD_PLACEHOLDER,
  CALLOUT_TRIGGERS,
  FIELD_REFERENCE_CODES,
  PRODUCT_SELECTOR_REFERENCE_IDS,
  getPasswordFieldNames,
  shouldExcludePasswordField,
} from "../constants";
import type { Tab, Field } from "@workspaceui/api-client/src/api/types";

describe("form/constants", () => {
  describe("static constants", () => {
    it("should have PASSWORD_PLACEHOLDER defined as ***", () => {
      expect(PASSWORD_PLACEHOLDER).toBe("***");
    });

    it("should have CALLOUT_TRIGGERS", () => {
      expect(CALLOUT_TRIGGERS.ON_BLUR).toBe("ON_BLUR");
      expect(CALLOUT_TRIGGERS.ON_CHANGE).toBe("ON_CHANGE");
    });

    it("should have FIELD_REFERENCE_CODES with expected entries", () => {
      expect(FIELD_REFERENCE_CODES.STRING.id).toBe("10");
      expect(FIELD_REFERENCE_CODES.BOOLEAN.id).toBe("20");
      expect(FIELD_REFERENCE_CODES.DATE.id).toBe("15");
      expect(FIELD_REFERENCE_CODES.BUTTON.id).toBe("28");
    });

    it("should have all FIELD_REFERENCE_CODES with calloutTrigger", () => {
      for (const [, ref] of Object.entries(FIELD_REFERENCE_CODES)) {
        expect(ref).toHaveProperty("id");
        expect(ref).toHaveProperty("calloutTrigger");
        expect([CALLOUT_TRIGGERS.ON_BLUR, CALLOUT_TRIGGERS.ON_CHANGE]).toContain(ref.calloutTrigger);
      }
    });

    it("should have PRODUCT_SELECTOR_REFERENCE_IDS as a non-empty array", () => {
      expect(PRODUCT_SELECTOR_REFERENCE_IDS.length).toBeGreaterThan(0);
    });
  });

  describe("getPasswordFieldNames", () => {
    it("should return empty set for undefined tab", () => {
      const result = getPasswordFieldNames();
      expect(result.size).toBe(0);
    });

    it("should return empty set for tab without fields", () => {
      const tab = {} as Tab;
      const result = getPasswordFieldNames(tab);
      expect(result.size).toBe(0);
    });

    it("should find password fields by reference code", () => {
      const tab = {
        fields: {
          pass: {
            hqlName: "password",
            column: { reference: FIELD_REFERENCE_CODES.PASSWORD.id },
          } as unknown as Field,
          name: {
            hqlName: "name",
            column: { reference: FIELD_REFERENCE_CODES.STRING.id },
          } as unknown as Field,
        },
      } as unknown as Tab;

      const result = getPasswordFieldNames(tab);
      expect(result.has("password")).toBe(true);
      expect(result.has("name")).toBe(false);
      expect(result.size).toBe(1);
    });

    it("should skip fields without hqlName", () => {
      const tab = {
        fields: {
          pass: {
            column: { reference: FIELD_REFERENCE_CODES.PASSWORD.id },
          } as unknown as Field,
        },
      } as unknown as Tab;

      const result = getPasswordFieldNames(tab);
      expect(result.size).toBe(0);
    });
  });

  describe("shouldExcludePasswordField", () => {
    const passwordFields = new Set(["password"]);

    it("should return false for new records", () => {
      expect(shouldExcludePasswordField("password", PASSWORD_PLACEHOLDER, passwordFields, true)).toBe(false);
    });

    it("should return false for non-password fields", () => {
      expect(shouldExcludePasswordField("name", PASSWORD_PLACEHOLDER, passwordFields, false)).toBe(false);
    });

    it("should return true for password field with placeholder value in edit mode", () => {
      expect(shouldExcludePasswordField("password", PASSWORD_PLACEHOLDER, passwordFields, false)).toBe(true);
    });

    it("should return false for password field with actual value in edit mode", () => {
      expect(shouldExcludePasswordField("password", "newPassword123", passwordFields, false)).toBe(false);
    });
  });
});
