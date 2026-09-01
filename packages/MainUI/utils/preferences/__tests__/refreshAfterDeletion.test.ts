import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { isRefreshAfterDeletionEnabled, REFRESH_AFTER_DELETION_PREFERENCE } from "../refreshAfterDeletion";

const WINDOW_ID = "129";
const OTHER_WINDOW_ID = "276";
const SCOPED_KEY = `${REFRESH_AFTER_DELETION_PREFERENCE}_${WINDOW_ID}`;

describe("isRefreshAfterDeletionEnabled", () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it("is enabled when the preference is set for that window", () => {
    savePreferences({ [SCOPED_KEY]: "Y" });
    expect(isRefreshAfterDeletionEnabled(WINDOW_ID)).toBe(true);
  });

  it("is enabled when the preference is set globally", () => {
    savePreferences({ [REFRESH_AFTER_DELETION_PREFERENCE]: "Y" });
    expect(isRefreshAfterDeletionEnabled(WINDOW_ID)).toBe(true);
  });

  it("is disabled when no preference is stored", () => {
    savePreferences({});
    expect(isRefreshAfterDeletionEnabled(WINDOW_ID)).toBe(false);
  });

  it("is disabled when the preference holds any other value", () => {
    savePreferences({ [SCOPED_KEY]: "N" });
    expect(isRefreshAfterDeletionEnabled(WINDOW_ID)).toBe(false);
  });

  it("lets the window-scoped value override an enabled global one", () => {
    savePreferences({ [REFRESH_AFTER_DELETION_PREFERENCE]: "Y", [SCOPED_KEY]: "N" });
    expect(isRefreshAfterDeletionEnabled(WINDOW_ID)).toBe(false);
  });

  it("is disabled when only another window has it enabled", () => {
    savePreferences({ [`${REFRESH_AFTER_DELETION_PREFERENCE}_${OTHER_WINDOW_ID}`]: "Y" });
    expect(isRefreshAfterDeletionEnabled(WINDOW_ID)).toBe(false);
  });

  it("falls back to the global key when the scoped value is empty", () => {
    savePreferences({ [SCOPED_KEY]: "", [REFRESH_AFTER_DELETION_PREFERENCE]: "Y" });
    expect(isRefreshAfterDeletionEnabled(WINDOW_ID)).toBe(true);
  });

  it("reads only the global key when no window id is given", () => {
    savePreferences({ [SCOPED_KEY]: "Y" });
    expect(isRefreshAfterDeletionEnabled()).toBe(false);
  });
});
