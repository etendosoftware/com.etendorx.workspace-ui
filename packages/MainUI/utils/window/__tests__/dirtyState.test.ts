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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { WindowState } from "@/utils/window/constants";
import {
  DIRTY_SOURCE_KINDS,
  DIRTY_TITLE_PREFIX,
  buildDirtySourceKey,
  formatDirtyTitle,
  getDirtySources,
  getDirtyWindowIdentifiers,
  hasAnyDirty,
  isTabDirty,
  isWindowDirty,
  parseDirtySourceKey,
  sortSourcesByTabLevel,
  type DirtyWindows,
} from "../dirtyState";

const WINDOW_A = "143_1000";
const WINDOW_B = "180_2000";
const HEADER_TAB = "header";
const LINES_TAB = "lines";

const FORM_HEADER_KEY = buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, HEADER_TAB);
const TABLE_LINES_KEY = buildDirtySourceKey(DIRTY_SOURCE_KINDS.TABLE, LINES_TAB);

/** Window state carrying only what the tab-level lookups read. */
const createWindow = (levels: Record<string, number>): WindowState =>
  ({
    windowId: "143",
    windowIdentifier: WINDOW_A,
    title: "",
    isActive: true,
    initialized: true,
    navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: true },
    tabs: Object.fromEntries(Object.entries(levels).map(([tabId, level]) => [tabId, { level }])),
  }) as unknown as WindowState;

describe("dirtyState", () => {
  describe("buildDirtySourceKey / parseDirtySourceKey", () => {
    it("round-trips a form source", () => {
      expect(parseDirtySourceKey(FORM_HEADER_KEY)).toEqual({
        kind: DIRTY_SOURCE_KINDS.FORM,
        tabId: HEADER_TAB,
      });
    });

    it("round-trips a table source", () => {
      expect(parseDirtySourceKey(TABLE_LINES_KEY)).toEqual({
        kind: DIRTY_SOURCE_KINDS.TABLE,
        tabId: LINES_TAB,
      });
    });

    it("keeps a tab id that contains the separator intact", () => {
      expect(parseDirtySourceKey("form:tab:1")).toEqual({ kind: DIRTY_SOURCE_KINDS.FORM, tabId: "tab:1" });
    });

    it.each([
      ["no separator", "formheader"],
      ["unknown kind", "widget:header"],
      ["empty tab id", "form:"],
      ["empty kind", ":header"],
      ["empty string", ""],
    ])("returns null for %s", (_label, key) => {
      expect(parseDirtySourceKey(key)).toBeNull();
    });
  });

  describe("isWindowDirty", () => {
    it("is true when a source is flagged", () => {
      const dirtyWindows: DirtyWindows = { [WINDOW_A]: { [FORM_HEADER_KEY]: true } };
      expect(isWindowDirty(dirtyWindows, WINDOW_A)).toBe(true);
    });

    it("is false for an unknown window", () => {
      expect(isWindowDirty({}, WINDOW_A)).toBe(false);
    });

    it("is false when every flag was cleared", () => {
      const dirtyWindows: DirtyWindows = { [WINDOW_A]: { [FORM_HEADER_KEY]: false } };
      expect(isWindowDirty(dirtyWindows, WINDOW_A)).toBe(false);
    });
  });

  describe("isTabDirty", () => {
    const dirtyWindows: DirtyWindows = {
      [WINDOW_A]: { [FORM_HEADER_KEY]: true, [TABLE_LINES_KEY]: true },
    };

    it("is true for the tab whose form is dirty", () => {
      expect(isTabDirty(dirtyWindows, WINDOW_A, HEADER_TAB)).toBe(true);
    });

    it("is true for the tab whose grid is dirty", () => {
      expect(isTabDirty(dirtyWindows, WINDOW_A, LINES_TAB)).toBe(true);
    });

    it("is false for a clean tab of a dirty window", () => {
      expect(isTabDirty(dirtyWindows, WINDOW_A, "payments")).toBe(false);
    });

    it("is false for an unknown window", () => {
      expect(isTabDirty(dirtyWindows, WINDOW_B, HEADER_TAB)).toBe(false);
    });
  });

  describe("hasAnyDirty / getDirtyWindowIdentifiers", () => {
    const dirtyWindows: DirtyWindows = {
      [WINDOW_A]: { [FORM_HEADER_KEY]: true },
      [WINDOW_B]: {},
    };

    it("reports at least one dirty window", () => {
      expect(hasAnyDirty(dirtyWindows)).toBe(true);
    });

    it("reports nothing dirty for an empty registry", () => {
      expect(hasAnyDirty({})).toBe(false);
    });

    it("reports nothing dirty when every window was cleared", () => {
      expect(hasAnyDirty({ [WINDOW_A]: {}, [WINDOW_B]: {} })).toBe(false);
    });

    it("lists only the windows that are dirty", () => {
      expect(getDirtyWindowIdentifiers(dirtyWindows)).toEqual([WINDOW_A]);
    });
  });

  describe("getDirtySources", () => {
    it("returns the parsed sources that are flagged", () => {
      const dirtyWindows: DirtyWindows = {
        [WINDOW_A]: { [FORM_HEADER_KEY]: true, [TABLE_LINES_KEY]: true },
      };

      expect(getDirtySources(dirtyWindows, WINDOW_A)).toEqual([
        { kind: DIRTY_SOURCE_KINDS.FORM, tabId: HEADER_TAB },
        { kind: DIRTY_SOURCE_KINDS.TABLE, tabId: LINES_TAB },
      ]);
    });

    it("skips cleared flags and malformed keys", () => {
      const dirtyWindows: DirtyWindows = {
        [WINDOW_A]: { [FORM_HEADER_KEY]: false, [TABLE_LINES_KEY]: true, garbage: true },
      };

      expect(getDirtySources(dirtyWindows, WINDOW_A)).toEqual([{ kind: DIRTY_SOURCE_KINDS.TABLE, tabId: LINES_TAB }]);
    });

    it("returns an empty list for an unknown window", () => {
      expect(getDirtySources({}, WINDOW_A)).toEqual([]);
    });
  });

  describe("sortSourcesByTabLevel", () => {
    const sources = [
      { kind: DIRTY_SOURCE_KINDS.FORM, tabId: LINES_TAB },
      { kind: DIRTY_SOURCE_KINDS.FORM, tabId: HEADER_TAB },
    ];

    it("puts the root tab before its child", () => {
      const window = createWindow({ [HEADER_TAB]: 0, [LINES_TAB]: 1 });

      expect(sortSourcesByTabLevel(sources, window).map((source) => source.tabId)).toEqual([HEADER_TAB, LINES_TAB]);
    });

    it("pushes tabs missing from the window to the end", () => {
      const window = createWindow({ [LINES_TAB]: 1 });

      expect(sortSourcesByTabLevel(sources, window).map((source) => source.tabId)).toEqual([LINES_TAB, HEADER_TAB]);
    });

    it("does not mutate the input and tolerates a missing window", () => {
      const original = [...sources];

      expect(sortSourcesByTabLevel(sources, undefined)).toHaveLength(2);
      expect(sources).toEqual(original);
    });
  });

  describe("formatDirtyTitle", () => {
    it("prefixes the marker when dirty", () => {
      expect(formatDirtyTitle("Sales Order", true)).toBe(`${DIRTY_TITLE_PREFIX}Sales Order`);
    });

    it("leaves the title untouched when clean", () => {
      expect(formatDirtyTitle("Sales Order", false)).toBe("Sales Order");
    });
  });
});
