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

import { resetSessionState } from "@/utils/session/resetSessionState";
import {
  DATE_DISPLAY,
  getDateDisplayStorageKey,
  toDateDisplay,
  useNotesPreferencesStore,
} from "../notesPreferencesStore";

jest.mock("@workspaceui/api-client/src/api/datasource", () => ({ datasource: { clearCache: jest.fn() } }));

const USER_A = "user-a";
const USER_B = "user-b";

const getItem = window.localStorage.getItem as jest.Mock;
const setItem = window.localStorage.setItem as jest.Mock;

/** Makes the browser storage hold the given mode for each user. */
const storeModes = (modes: Record<string, string>) =>
  getItem.mockImplementation((key: string) => {
    const userId = Object.keys(modes).find((id) => getDateDisplayStorageKey(id) === key);
    return userId ? modes[userId] : null;
  });

const getState = () => useNotesPreferencesStore.getState();

describe("notesPreferencesStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getItem.mockReset();
    setItem.mockReset();
    useNotesPreferencesStore.setState(useNotesPreferencesStore.getInitialState(), true);
  });

  it("shows the time elapsed by default", () => {
    expect(getState().dateDisplay).toBe(DATE_DISPLAY.RELATIVE);
  });

  it("loads the mode stored for the user", () => {
    storeModes({ [USER_A]: DATE_DISPLAY.ABSOLUTE });

    getState().loadForUser(USER_A);

    expect(getState().dateDisplay).toBe(DATE_DISPLAY.ABSOLUTE);
  });

  it("stores the chosen mode under the key of the user", () => {
    getState().loadForUser(USER_A);

    getState().setDateDisplay(DATE_DISPLAY.ABSOLUTE);

    expect(getState().dateDisplay).toBe(DATE_DISPLAY.ABSOLUTE);
    expect(setItem).toHaveBeenCalledWith(getDateDisplayStorageKey(USER_A), DATE_DISPLAY.ABSOLUTE);
  });

  it("does not store the mode while no user is known", () => {
    getState().setDateDisplay(DATE_DISPLAY.ABSOLUTE);

    expect(getState().dateDisplay).toBe(DATE_DISPLAY.ABSOLUTE);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("reads the storage once per user and keeps each account's own mode", () => {
    storeModes({ [USER_A]: DATE_DISPLAY.ABSOLUTE });

    getState().loadForUser(USER_A);
    getState().loadForUser(USER_A);
    expect(getItem).toHaveBeenCalledTimes(1);

    getState().loadForUser(USER_B);
    expect(getState().dateDisplay).toBe(DATE_DISPLAY.RELATIVE);
  });

  it("keeps the stored mode after logout and restores it on the next login", () => {
    storeModes({ [USER_A]: DATE_DISPLAY.ABSOLUTE });
    getState().loadForUser(USER_A);

    resetSessionState();

    expect(getState()).toMatchObject({ userId: null, dateDisplay: DATE_DISPLAY.RELATIVE });
    expect(setItem).not.toHaveBeenCalled();
    getState().loadForUser(USER_A);
    expect(getState().dateDisplay).toBe(DATE_DISPLAY.ABSOLUTE);
  });

  it("falls back to the default when the storage cannot be used", () => {
    getItem.mockImplementation(() => {
      throw new Error("blocked");
    });
    setItem.mockImplementation(() => {
      throw new Error("blocked");
    });

    getState().loadForUser(USER_A);
    expect(getState().dateDisplay).toBe(DATE_DISPLAY.RELATIVE);

    expect(() => getState().setDateDisplay(DATE_DISPLAY.ABSOLUTE)).not.toThrow();
    expect(getState().dateDisplay).toBe(DATE_DISPLAY.ABSOLUTE);
  });
});

describe("toDateDisplay", () => {
  it("keeps the absolute mode and defaults anything else to relative", () => {
    expect(toDateDisplay(DATE_DISPLAY.ABSOLUTE)).toBe(DATE_DISPLAY.ABSOLUTE);
    expect(toDateDisplay(DATE_DISPLAY.RELATIVE)).toBe(DATE_DISPLAY.RELATIVE);
    expect(toDateDisplay("garbage")).toBe(DATE_DISPLAY.RELATIVE);
    expect(toDateDisplay(null)).toBe(DATE_DISPLAY.RELATIVE);
  });
});
