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
import { notifyReportPopupBlocked, tryOpenReportPopup } from "@/utils/reportPopup";
import {
  findLiveMenuEntry,
  getManualProcessConfig,
  getManualProcessUrl,
  isClassicProcessMenuItem,
  openClassicProcessUrl,
  openLegacyManualProcess,
} from "../legacyMenuEntry";
import type { ExtendedMenu } from "../menuItemDispatch";

jest.mock("@/utils/reportPopup", () => ({ tryOpenReportPopup: jest.fn(), notifyReportPopupBlocked: jest.fn() }));

const BASE_URL = "http://localhost:8080/etendo";
const TOKEN = "TOKEN123";
const FORM = "Form";
const MODULE_FORM_URL = "/com.example.module.ad_forms/ModuleForm.html";
const CLASSIC_URL = "https://classic/url";
const FORM_MENU_ID = "MENU_FORM";
const POPUP_TEXTS = { title: "Blocked", openLabel: "Open" };

const buildItem = (overrides: Partial<ExtendedMenu> = {}): ExtendedMenu => ({
  id: "MENU_ID",
  name: "Menu Name",
  ...overrides,
});

/** Runs the retry handed to the blocked-popup notice. */
const retryBlockedPopup = () => jest.mocked(notifyReportPopupBlocked).mock.calls[0][0]();

describe("legacyMenuEntry", () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    openSpy = jest.spyOn(window, "open").mockReturnValue({ closed: false } as Window);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  describe("getManualProcessConfig", () => {
    it("loads the form address resolved by the backend, a module path included, untouched", () => {
      const config = getManualProcessConfig(
        buildItem({ type: FORM, formId: "F1", formUrl: MODULE_FORM_URL }),
        TOKEN,
        BASE_URL
      );

      expect(config).toEqual({
        url: `${BASE_URL}/meta/legacy/security/Menu.html?url=${MODULE_FORM_URL}&noprefs=true&hideMenu=true&Command=DEFAULT&token=${TOKEN}`,
        size: "large",
      });
    });

    it("falls back to the bundled form address when the backend sends none", () => {
      const config = getManualProcessConfig(buildItem({ type: FORM, formId: "110" }), null, BASE_URL);

      expect(config?.url).toBe(
        `${BASE_URL}/meta/legacy/security/Menu.html?url=/ad_forms/GenerateShipmentsmanual.html&noprefs=true&hideMenu=true&Command=DEFAULT`
      );
    });

    it("returns null for a form without any known address", () => {
      expect(getManualProcessConfig(buildItem({ type: FORM, formId: "UNKNOWN" }), TOKEN, BASE_URL)).toBeNull();
    });

    it("builds the action button URL of a process", () => {
      const config = getManualProcessConfig(buildItem({ type: "Process", processId: "P1" }), TOKEN, BASE_URL);

      expect(config).toEqual({
        url: `${BASE_URL}/meta/legacy/ad_actionButton/ActionButton_Responser.html?Command=BUTTONP1&IsPopUpCall=1&token=${TOKEN}`,
        size: "default",
      });
    });

    it("returns null for entries that are neither a process nor a form", () => {
      expect(getManualProcessConfig(buildItem({ type: "Window" }), TOKEN, BASE_URL)).toBeNull();
    });
  });

  describe("getManualProcessUrl / isClassicProcessMenuItem", () => {
    it("returns the process URL, or null when there is none", () => {
      expect(getManualProcessUrl(buildItem({ processUrl: "/ad_reports/Report.html" }))).toBe("/ad_reports/Report.html");
      expect(getManualProcessUrl(buildItem())).toBeNull();
    });

    it.each([
      ["ProcessManual", true],
      ["Report", true],
      [FORM, false],
    ])("tells whether a %s entry opens in Classic", (type, expected) => {
      expect(isClassicProcessMenuItem(buildItem({ type }))).toBe(expected);
    });
  });

  describe("openClassicProcessUrl", () => {
    it("opens modal processes in a popup and retries it when blocked", () => {
      jest.mocked(tryOpenReportPopup).mockReturnValue(false);

      openClassicProcessUrl(CLASSIC_URL, true, POPUP_TEXTS);
      retryBlockedPopup();

      expect(tryOpenReportPopup).toHaveBeenCalledTimes(2);
      expect(notifyReportPopupBlocked).toHaveBeenCalledWith(expect.any(Function), POPUP_TEXTS);
    });

    it("does not notify when the modal popup opens", () => {
      jest.mocked(tryOpenReportPopup).mockReturnValue(true);

      openClassicProcessUrl(CLASSIC_URL, true, POPUP_TEXTS);

      expect(notifyReportPopupBlocked).not.toHaveBeenCalled();
    });

    it("opens non-modal processes in a new tab and retries it when blocked", () => {
      openSpy.mockReturnValueOnce(null);

      openClassicProcessUrl(CLASSIC_URL, false, POPUP_TEXTS);
      retryBlockedPopup();

      expect(openSpy).toHaveBeenNthCalledWith(2, CLASSIC_URL, "_blank");
    });
  });

  describe("openLegacyManualProcess", () => {
    it("opens the popup without any notice when it is allowed", () => {
      openLegacyManualProcess(CLASSIC_URL, POPUP_TEXTS);

      expect(openSpy).toHaveBeenCalledWith(CLASSIC_URL, "Test", "width=950,height=700");
      expect(notifyReportPopupBlocked).not.toHaveBeenCalled();
    });

    it("offers to open the same popup again when it is blocked", () => {
      openSpy.mockReturnValueOnce(null);

      openLegacyManualProcess(CLASSIC_URL, POPUP_TEXTS);
      retryBlockedPopup();

      expect(openSpy).toHaveBeenCalledTimes(2);
      expect(openSpy.mock.calls[1][0]).toBe(CLASSIC_URL);
    });
  });

  describe("findLiveMenuEntry", () => {
    const liveForm = buildItem({ id: FORM_MENU_ID, type: FORM, formId: "F1", formUrl: MODULE_FORM_URL });
    const menu: Menu[] = [buildItem({ id: "FOLDER", type: "Folder", children: [liveForm] })];

    it("finds the live entry with the same id and type", () => {
      expect(findLiveMenuEntry(menu, { id: FORM_MENU_ID, type: FORM })).toBe(liveForm);
    });

    it("ignores an entry with the same id but another type", () => {
      expect(findLiveMenuEntry(menu, { id: FORM_MENU_ID, type: "Window" })).toBeNull();
    });

    it("returns null when the menu does not have the entry", () => {
      expect(findLiveMenuEntry(menu, { id: "MISSING", type: FORM })).toBeNull();
      expect(findLiveMenuEntry(undefined, { id: FORM_MENU_ID, type: FORM })).toBeNull();
    });
  });
});
