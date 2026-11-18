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

"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** How the creation date of the notes is shown: time elapsed in words, or the exact date and time. */
export const DATE_DISPLAY = { RELATIVE: "relative", ABSOLUTE: "absolute" } as const;
export type DateDisplay = (typeof DATE_DISPLAY)[keyof typeof DATE_DISPLAY];

/** Key of the session storage entry that keeps the preferences across page reloads. */
export const NOTES_PREFERENCES_STORAGE_KEY = "notes-preferences";

/**
 * Reads a stored date display mode, ignoring any value that is not a known mode.
 *
 * @param stored - The value read from the storage
 * @returns The stored mode, or the relative one by default
 */
export const toDateDisplay = (stored: unknown): DateDisplay => {
  if (stored === DATE_DISPLAY.ABSOLUTE) {
    return DATE_DISPLAY.ABSOLUTE;
  }
  return DATE_DISPLAY.RELATIVE;
};

interface NotesPreferencesStore {
  dateDisplay: DateDisplay;
  setDateDisplay: (dateDisplay: DateDisplay) => void;
}

/**
 * Preferences of the Notes section of the forms, shared by every window of the application: a change in
 * one window shows at once in the others. They last for the session: kept in the session storage across
 * page reloads, and reset on logout (see `resetSessionState`), so the next user starts from the defaults.
 */
export const useNotesPreferencesStore = create<NotesPreferencesStore>()(
  persist(
    (set) => ({
      dateDisplay: DATE_DISPLAY.RELATIVE,
      setDateDisplay: (dateDisplay) => set({ dateDisplay }),
    }),
    {
      name: NOTES_PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ dateDisplay: state.dateDisplay }),
      // A tampered or outdated stored value falls back to the default mode
      merge: (persisted, current) => ({
        ...current,
        dateDisplay: toDateDisplay((persisted as Partial<NotesPreferencesStore> | undefined)?.dateDisplay),
      }),
    }
  )
);
