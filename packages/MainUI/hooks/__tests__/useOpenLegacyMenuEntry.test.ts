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
import { useOpenLegacyMenuEntry } from "@/hooks/useOpenLegacyMenuEntry";
import type { ExtendedMenu } from "@/utils/menu/menuItemDispatch";
import { openLegacyManualProcess, openClassicProcessUrl } from "@/utils/menu/legacyMenuEntry";
import { openEtendoViewPopup } from "@/utils/menu/openEtendoView";

jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/utils/menu/openEtendoView", () => ({ openEtendoViewPopup: jest.fn() }));
jest.mock("@/utils/menu/legacyMenuEntry", () => ({
  ...jest.requireActual("@/utils/menu/legacyMenuEntry"),
  openLegacyManualProcess: jest.fn(),
  openClassicProcessUrl: jest.fn(),
}));

const MODULE_FORM_URL = "/com.example.module.ad_forms/ModuleForm.html";

const buildItem = (overrides: Partial<ExtendedMenu>): ExtendedMenu => ({ id: "MENU_ID", name: "Entry", ...overrides });

const openEntry = (item: ExtendedMenu): boolean => {
  const { result } = renderHook(() => useOpenLegacyMenuEntry());
  return result.current(item);
};

describe("useOpenLegacyMenuEntry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens a form in its Classic popup with the address resolved by the backend", () => {
    expect(openEntry(buildItem({ type: "Form", formId: "F1", formUrl: MODULE_FORM_URL }))).toBe(true);

    expect(openLegacyManualProcess).toHaveBeenCalledWith(expect.stringContaining(`url=${MODULE_FORM_URL}&`), {
      title: "drawer.legacyWindowPopupBlocked",
      openLabel: "drawer.openLegacyWindow",
    });
  });

  it("opens ProcessManual / Report entries in Etendo Classic", () => {
    const item = buildItem({ type: "Report", processUrl: "/ad_reports/Report.html", isModalProcess: true });

    expect(openEntry(item)).toBe(true);

    expect(openClassicProcessUrl).toHaveBeenCalledWith(expect.stringContaining("http"), true, {
      title: "processModal.gridToolbar.openLegacyReport.popupBlockedTitle",
      openLabel: "processModal.gridToolbar.openLegacyReport.openManually",
    });
  });

  it("opens View entries in a Classic popup", () => {
    expect(openEntry(buildItem({ type: "View", viewId: "SomeView" }))).toBe(true);

    expect(openEtendoViewPopup).toHaveBeenCalledWith(expect.objectContaining({ viewId: "SomeView" }));
  });

  it.each([
    ["a window", buildItem({ type: "Window", windowId: "143" })],
    ["a report without URL", buildItem({ type: "Report" })],
    ["a view without id", buildItem({ type: "View" })],
  ])("leaves %s to the caller", (_label, item) => {
    expect(openEntry(item)).toBe(false);

    expect(openLegacyManualProcess).not.toHaveBeenCalled();
    expect(openClassicProcessUrl).not.toHaveBeenCalled();
    expect(openEtendoViewPopup).not.toHaveBeenCalled();
  });
});
