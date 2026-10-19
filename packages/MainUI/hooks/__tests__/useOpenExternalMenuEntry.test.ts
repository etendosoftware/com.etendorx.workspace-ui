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

import { renderHook } from "@testing-library/react";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useOpenExternalMenuEntry } from "../useOpenExternalMenuEntry";
import { useWindowStore } from "@/stores/windowStore";
import { notifyReportPopupBlocked } from "@/utils/reportPopup";
import { buildExternalPageWindowId } from "@/utils/menu/externalMenuEntry";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/utils/reportPopup", () => ({ notifyReportPopupBlocked: jest.fn() }));

const MENU_ID = "A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6";
const MENU_NAME = "TEST External";
const PROTOCOL_LESS_URL = "example.com";
const NORMALIZED_URL = "http://example.com";

const buildExternalEntry = (overrides: Partial<Menu> = {}): Menu => ({
  id: MENU_ID,
  name: MENU_NAME,
  type: "External",
  url: PROTOCOL_LESS_URL,
  ...overrides,
});

const openEntry = (item: Menu) => {
  const { result } = renderHook(() => useOpenExternalMenuEntry());
  result.current(item);
};

const getWindows = () => Object.values(useWindowStore.getState().windows);

describe("useOpenExternalMenuEntry", () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    useWindowStore.getState().cleanState();
    openSpy = jest.spyOn(window, "open").mockReturnValue({ opener: window } as unknown as Window);
    jest.mocked(notifyReportPopupBlocked).mockClear();
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  describe("open link in browser", () => {
    it("opens the normalized URL in a new browser tab without creating an in-app tab", () => {
      openEntry(buildExternalEntry({ openLinkInBrowser: true }));

      expect(openSpy).toHaveBeenCalledWith(NORMALIZED_URL, "_blank");
      expect(notifyReportPopupBlocked).not.toHaveBeenCalled();
      expect(getWindows()).toHaveLength(0);
    });

    it("shows the blocked-popup notice with a manual retry when the browser blocks it", () => {
      openSpy.mockReturnValue(null);

      openEntry(buildExternalEntry({ openLinkInBrowser: true }));

      expect(notifyReportPopupBlocked).toHaveBeenCalledWith(expect.any(Function), {
        title: "drawer.externalLinkPopupBlocked",
        openLabel: "drawer.openExternalLink",
      });

      const retry = jest.mocked(notifyReportPopupBlocked).mock.calls[0][0];
      retry();
      expect(openSpy).toHaveBeenCalledTimes(2);
      expect(openSpy).toHaveBeenLastCalledWith(NORMALIZED_URL, "_blank");
    });
  });

  describe("open link inside the application", () => {
    it("opens an active in-app tab embedding the normalized URL", () => {
      openEntry(buildExternalEntry({ openLinkInBrowser: false }));

      const windows = getWindows();
      expect(openSpy).not.toHaveBeenCalled();
      expect(windows).toHaveLength(1);
      expect(windows[0]).toMatchObject({
        windowId: buildExternalPageWindowId(MENU_ID),
        title: MENU_NAME,
        isActive: true,
        initialized: true,
        externalUrl: NORMALIZED_URL,
      });
    });

    it("focuses the tab already open for the same entry instead of duplicating it", () => {
      openEntry(buildExternalEntry());
      const [first] = getWindows();
      useWindowStore.getState().setWindowActive({ windowIdentifier: "143_1", windowData: { title: "Other" } });

      openEntry(buildExternalEntry());

      const windows = getWindows();
      expect(windows).toHaveLength(2);
      expect(useWindowStore.getState().windows[first.windowIdentifier].isActive).toBe(true);
    });
  });

  it.each([
    ["has no URL", { url: undefined }],
    ["has a non-web URL", { url: "ftp://example.com" }],
  ])("does nothing when the entry %s", (_label, overrides) => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    openEntry(buildExternalEntry({ openLinkInBrowser: true, ...overrides }));

    expect(openSpy).not.toHaveBeenCalled();
    expect(getWindows()).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
