import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import {
  buildProcessPreferenceContext,
  getGridPageSize,
  getLogoutRedirectUrl,
  getNumericPreference,
  isPreferenceDisabled,
  isPreferenceYes,
} from "../classicPreferences";

const NAME = "SomePreference";
const WINDOW_ID = "143";
const SCOPED_KEY = `${NAME}_${WINDOW_ID}`;
const FALLBACK = 100;

describe("classicPreferences", () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  describe("isPreferenceYes", () => {
    it("is true when the window-scoped value is Y", () => {
      savePreferences({ [SCOPED_KEY]: "Y", [NAME]: "N" });
      expect(isPreferenceYes(NAME, WINDOW_ID)).toBe(true);
    });

    it("is true when only the global value is Y", () => {
      savePreferences({ [NAME]: "Y" });
      expect(isPreferenceYes(NAME, WINDOW_ID)).toBe(true);
    });

    it("is false when the preference is missing or holds another value", () => {
      savePreferences({});
      expect(isPreferenceYes(NAME)).toBe(false);
      savePreferences({ [NAME]: "N" });
      expect(isPreferenceYes(NAME)).toBe(false);
    });
  });

  describe("isPreferenceDisabled", () => {
    it.each(["N", "n", "false", "FALSE"])("is true for %s", (value) => {
      savePreferences({ [SCOPED_KEY]: value });
      expect(isPreferenceDisabled(NAME, WINDOW_ID)).toBe(true);
    });

    it("is false when the preference is missing", () => {
      savePreferences({});
      expect(isPreferenceDisabled(NAME, WINDOW_ID)).toBe(false);
    });

    it("is false when the preference is Y", () => {
      savePreferences({ [NAME]: "Y" });
      expect(isPreferenceDisabled(NAME)).toBe(false);
    });
  });

  describe("getNumericPreference", () => {
    it("returns the window-scoped number", () => {
      savePreferences({ [SCOPED_KEY]: "50", [NAME]: "75" });
      expect(getNumericPreference(NAME, WINDOW_ID, FALLBACK)).toBe(50);
    });

    it("returns the global number when there is no window value", () => {
      savePreferences({ [NAME]: "75" });
      expect(getNumericPreference(NAME, WINDOW_ID, FALLBACK)).toBe(75);
    });

    it.each([undefined, "", "abc", "0", "-5"])("falls back for %p", (value) => {
      savePreferences(value === undefined ? {} : { [NAME]: value });
      expect(getNumericPreference(NAME, undefined, FALLBACK)).toBe(FALLBACK);
    });
  });

  describe("buildProcessPreferenceContext", () => {
    it("is empty when the preferences are not set", () => {
      savePreferences({});
      expect(buildProcessPreferenceContext(WINDOW_ID)).toEqual({ FinancialManagement: "", _ShowAcct: "" });
    });

    it("reads FinancialManagement by window and ShowAcct only globally", () => {
      savePreferences({ [`FinancialManagement_${WINDOW_ID}`]: "Y", [`ShowAcct_${WINDOW_ID}`]: "Y" });
      expect(buildProcessPreferenceContext(WINDOW_ID)).toEqual({ FinancialManagement: "Y", _ShowAcct: "" });
    });
  });

  describe("getGridPageSize", () => {
    it("uses dataPageSize of the window", () => {
      savePreferences({ [`dataPageSize_${WINDOW_ID}`]: "50" });
      expect(getGridPageSize(WINDOW_ID)).toBe(50);
    });

    it("defaults to 100 records", () => {
      savePreferences({});
      expect(getGridPageSize(WINDOW_ID)).toBe(100);
    });
  });

  describe("getLogoutRedirectUrl", () => {
    it("returns the configured address", () => {
      savePreferences({ LogoutRedirectURL: " https://www.example.com " });
      expect(getLogoutRedirectUrl()).toBe("https://www.example.com");
    });

    it.each([undefined, "", "Default"])("keeps the standard logout for %p", (value) => {
      savePreferences(value === undefined ? {} : { LogoutRedirectURL: value });
      expect(getLogoutRedirectUrl()).toBeUndefined();
    });
  });
});
