/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import {
  DATE_DISPLAY,
  NOTES_PREFERENCES_STORAGE_KEY,
  toDateDisplay,
  useNotesPreferencesStore,
} from "../notesPreferencesStore";

/** Makes the session storage return the given stored preferences. */
const storePreferences = (dateDisplay: unknown) =>
  (window.sessionStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ state: { dateDisplay }, version: 0 }));

describe("notesPreferencesStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotesPreferencesStore.setState(useNotesPreferencesStore.getInitialState(), true);
  });

  it("shows the time elapsed by default", () => {
    expect(useNotesPreferencesStore.getState().dateDisplay).toBe(DATE_DISPLAY.RELATIVE);
  });

  it("keeps the chosen mode in the session storage", () => {
    useNotesPreferencesStore.getState().setDateDisplay(DATE_DISPLAY.ABSOLUTE);

    expect(useNotesPreferencesStore.getState().dateDisplay).toBe(DATE_DISPLAY.ABSOLUTE);
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      NOTES_PREFERENCES_STORAGE_KEY,
      expect.stringContaining(DATE_DISPLAY.ABSOLUTE)
    );
  });

  it("restores the mode of the session after a reload", async () => {
    storePreferences(DATE_DISPLAY.ABSOLUTE);

    await useNotesPreferencesStore.persist.rehydrate();

    expect(useNotesPreferencesStore.getState().dateDisplay).toBe(DATE_DISPLAY.ABSOLUTE);
  });

  it("falls back to the default when the stored mode is unknown", async () => {
    storePreferences("garbage");

    await useNotesPreferencesStore.persist.rehydrate();

    expect(useNotesPreferencesStore.getState().dateDisplay).toBe(DATE_DISPLAY.RELATIVE);
  });
});

describe("toDateDisplay", () => {
  it("keeps the absolute mode and defaults anything else to relative", () => {
    expect(toDateDisplay(DATE_DISPLAY.ABSOLUTE)).toBe(DATE_DISPLAY.ABSOLUTE);
    expect(toDateDisplay(DATE_DISPLAY.RELATIVE)).toBe(DATE_DISPLAY.RELATIVE);
    expect(toDateDisplay("garbage")).toBe(DATE_DISPLAY.RELATIVE);
    expect(toDateDisplay(undefined)).toBe(DATE_DISPLAY.RELATIVE);
  });
});
