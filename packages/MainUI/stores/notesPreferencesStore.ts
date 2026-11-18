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

/** How the creation date of the notes is shown: time elapsed in words, or the exact date and time. */
export const DATE_DISPLAY = { RELATIVE: "relative", ABSOLUTE: "absolute" } as const;
export type DateDisplay = (typeof DATE_DISPLAY)[keyof typeof DATE_DISPLAY];

const STORAGE_KEY_PREFIX = "notes-preferences.dateDisplay.";

/**
 * Builds the browser storage key of a user's date display mode: each account keeps its own choice.
 *
 * @param userId - The AD_User_ID of the user
 * @returns The storage key
 */
export const getDateDisplayStorageKey = (userId: string): string => `${STORAGE_KEY_PREFIX}${userId}`;

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

/** Reads the stored mode of a user; storage failures (private mode, blocked storage) read as the default. */
const readDateDisplay = (userId: string): DateDisplay => {
  try {
    return toDateDisplay(window.localStorage.getItem(getDateDisplayStorageKey(userId)));
  } catch {
    return DATE_DISPLAY.RELATIVE;
  }
};

/** Stores the mode of a user; a storage failure only means the choice is not remembered. */
const writeDateDisplay = (userId: string, dateDisplay: DateDisplay): void => {
  try {
    window.localStorage.setItem(getDateDisplayStorageKey(userId), dateDisplay);
  } catch {
    // The mode still applies to the current session
  }
};

interface NotesPreferencesStore {
  /** The user whose preferences are loaded, null before any user is known. */
  userId: string | null;
  dateDisplay: DateDisplay;
  /** Loads the stored preferences of the user, once per user. */
  loadForUser: (userId: string) => void;
  setDateDisplay: (dateDisplay: DateDisplay) => void;
}

/**
 * Preferences of the Notes section of the forms, shared by every window of the application: a change in
 * one window shows at once in the others. They are remembered per account in the browser storage, so they
 * survive logout and each user keeps their own choice. On logout only the loaded state is reset (see
 * `resetSessionState`); the stored choice stays for the next login of that user.
 */
export const useNotesPreferencesStore = create<NotesPreferencesStore>()((set, get) => ({
  userId: null,
  dateDisplay: DATE_DISPLAY.RELATIVE,
  loadForUser: (userId) => {
    if (get().userId === userId) return;
    set({ userId, dateDisplay: readDateDisplay(userId) });
  },
  setDateDisplay: (dateDisplay) => {
    set({ dateDisplay });
    const { userId } = get();
    if (userId) {
      writeDateDisplay(userId, dateDisplay);
    }
  },
}));
