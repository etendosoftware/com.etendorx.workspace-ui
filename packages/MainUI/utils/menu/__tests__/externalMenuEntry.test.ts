/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import type { Menu } from "@workspaceui/api-client/src/api/types";
import {
  EXTERNAL_PAGE_WINDOW_PREFIX,
  buildExternalPageWindowId,
  findExternalMenuEntry,
  getMenuIdFromExternalPageWindowId,
  isExternalMenuEntry,
  isExternalPageWindowId,
  normalizeExternalUrl,
  openUrlInNewBrowserTab,
} from "../externalMenuEntry";

const MENU_ID = "A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6";
const EXTERNAL = "External";
const EXAMPLE_URL = "https://example.com";

const buildMenuItem = (overrides: Partial<Menu> = {}): Menu => ({
  id: MENU_ID,
  name: "Menu Name",
  ...overrides,
});

describe("externalMenuEntry", () => {
  describe("normalizeExternalUrl", () => {
    it.each([
      ["keeps an https URL", EXAMPLE_URL, EXAMPLE_URL],
      ["keeps an http URL", "http://example.com/a?b=1", "http://example.com/a?b=1"],
      ["keeps an upper-case protocol", "HTTPS://example.com", "HTTPS://example.com"],
      ["prepends http:// when there is no protocol", "example.com", "http://example.com"],
      ["trims surrounding spaces", "  example.com/path  ", "http://example.com/path"],
    ])("%s", (_label, url, expected) => {
      expect(normalizeExternalUrl(url)).toBe(expected);
    });

    it.each([
      ["undefined", undefined],
      ["null", null],
      ["an empty string", ""],
      ["a blank string", "   "],
      ["a non-web protocol", "ftp://example.com"],
      ["a javascript protocol", "javascript://alert(1)"],
      ["an unparsable URL", "http://"],
      ["a javascript: URL without ://", "javascript:alert(1)"],
    ])("returns null for %s", (_label, url) => {
      expect(normalizeExternalUrl(url)).toBeNull();
    });
  });

  describe("isExternalMenuEntry", () => {
    it("returns true only for External entries", () => {
      expect(isExternalMenuEntry(buildMenuItem({ type: EXTERNAL }))).toBe(true);
      expect(isExternalMenuEntry(buildMenuItem({ type: "Window" }))).toBe(false);
      expect(isExternalMenuEntry(buildMenuItem())).toBe(false);
    });
  });

  describe("external page window ids", () => {
    it("builds a windowId from the menu id and the prefix, without underscores", () => {
      const windowId = buildExternalPageWindowId(MENU_ID);
      expect(windowId).toBe(`${EXTERNAL_PAGE_WINDOW_PREFIX}${MENU_ID}`);
      expect(windowId).not.toContain("_");
    });

    it("recognises only external page window ids", () => {
      expect(isExternalPageWindowId(buildExternalPageWindowId(MENU_ID))).toBe(true);
      expect(isExternalPageWindowId("143")).toBe(false);
      expect(isExternalPageWindowId(undefined)).toBe(false);
      expect(isExternalPageWindowId(null)).toBe(false);
    });

    it("extracts the menu id back from the windowId", () => {
      expect(getMenuIdFromExternalPageWindowId(buildExternalPageWindowId(MENU_ID))).toBe(MENU_ID);
    });
  });

  describe("findExternalMenuEntry", () => {
    const external = buildMenuItem({ type: EXTERNAL, url: EXAMPLE_URL });
    const menu: Menu[] = [
      buildMenuItem({
        id: "FOLDER",
        type: "Summary",
        children: [buildMenuItem({ id: "WIN", type: "Window" }), external],
      }),
    ];

    it("finds a nested External entry by id", () => {
      expect(findExternalMenuEntry(menu, MENU_ID)).toBe(external);
    });

    it("ignores entries with the same id that are not External", () => {
      expect(findExternalMenuEntry(menu, "WIN")).toBeUndefined();
    });

    it("returns undefined when the id is missing or the menu is empty", () => {
      expect(findExternalMenuEntry(menu, "UNKNOWN")).toBeUndefined();
      expect(findExternalMenuEntry(undefined, MENU_ID)).toBeUndefined();
      expect(findExternalMenuEntry(null, MENU_ID)).toBeUndefined();
    });
  });

  describe("openUrlInNewBrowserTab", () => {
    let openSpy: jest.SpyInstance;

    beforeEach(() => {
      openSpy = jest.spyOn(window, "open");
    });

    afterEach(() => {
      openSpy.mockRestore();
    });

    it("opens the URL in a new tab and cuts the opener link", () => {
      const popup = { opener: window } as unknown as Window;
      openSpy.mockReturnValue(popup);

      expect(openUrlInNewBrowserTab(EXAMPLE_URL)).toBe(true);
      expect(openSpy).toHaveBeenCalledWith(EXAMPLE_URL, "_blank");
      expect(popup.opener).toBeNull();
    });

    it("returns false when the browser blocks the new tab", () => {
      openSpy.mockReturnValue(null);
      expect(openUrlInNewBrowserTab(EXAMPLE_URL)).toBe(false);
    });
  });
});
