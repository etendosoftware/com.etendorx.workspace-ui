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

/**
 * Unit tests for the External (external link) branch of the Sidebar menu click dispatch.
 */

import { act, render } from "@testing-library/react";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import Sidebar from "../Sidebar";
import { useWindowStore } from "@/stores/windowStore";
import { notifyReportPopupBlocked, tryOpenReportPopup } from "@/utils/reportPopup";

const mockOpenExternalMenuEntry = jest.fn();
let capturedOnClick: (item: Menu) => void = () => {};

jest.mock("@workspaceui/componentlibrary/src/components/Drawer/index", () => ({
  Drawer: ({ onClick }: { onClick: (item: Menu) => void }) => {
    capturedOnClick = onClick;
    return null;
  },
}));

jest.mock("../ProcessModal/ProcessDefinitionModal", () => ({ __esModule: true, default: () => null }));
jest.mock("../Drawer/RecentlyViewed", () => ({ RecentlyViewed: () => null }));
jest.mock("@workspaceui/componentlibrary/src/components/Version", () => ({ __esModule: true, default: () => null }));
jest.mock("@/hooks/useOpenExternalMenuEntry", () => ({
  useOpenExternalMenuEntry: () => mockOpenExternalMenuEntry,
}));
jest.mock("@/hooks/useMenu", () => ({ useMenu: () => [] }));
jest.mock("../../hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("../../hooks/useMenuTranslation", () => ({ useMenuTranslation: () => ({ translateMenuItem: jest.fn() }) }));
jest.mock("../../hooks/useExpandedMenuItems", () => ({
  useExpandedMenuItems: () => ({ expandedItems: new Set(), setExpandedItems: jest.fn() }),
}));
jest.mock("@/contexts/language", () => ({ useLanguage: () => ({ language: "en_US", prevLanguage: "en_US" }) }));
jest.mock("../../contexts/RuntimeConfigContext", () => ({ useRuntimeConfig: () => ({ config: {} }) }));
jest.mock("@/stores/metadataStore", () => ({
  useMetadataZustandStore: (selector: (state: unknown) => unknown) =>
    selector({ loadWindowData: jest.fn().mockResolvedValue({}), prefetchWindowData: jest.fn() }),
}));

jest.mock("@/utils/reportPopup", () => ({ tryOpenReportPopup: jest.fn(), notifyReportPopupBlocked: jest.fn() }));

const buildReportItem = (isModalProcess: boolean): Menu => ({
  id: "MENU_REPORT",
  name: "Report",
  type: "Report",
  processUrl: "/ad_reports/Report.html",
  isModalProcess,
});

/** Runs the retry handed to the blocked-popup notice. */
const retryBlockedPopup = () => jest.mocked(notifyReportPopupBlocked).mock.calls[0][0]();

const clickMenuItem = (item: Menu) => {
  render(<Sidebar />);
  act(() => capturedOnClick(item));
};

describe("Sidebar menu click dispatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.getState().cleanState();
  });

  it("delegates External entries to the external link opener", () => {
    const item: Menu = {
      id: "A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6",
      name: "TEST External",
      type: "External",
      url: "example.com",
    };

    clickMenuItem(item);

    expect(mockOpenExternalMenuEntry).toHaveBeenCalledWith(item);
    expect(useWindowStore.getState().windows).toEqual({});
  });

  describe("Classic ProcessManual / Report entries", () => {
    let openSpy: jest.SpyInstance;

    beforeEach(() => {
      openSpy = jest.spyOn(window, "open").mockReturnValue({} as Window);
    });

    afterEach(() => {
      openSpy.mockRestore();
    });

    it("opens modal processes in a popup", () => {
      jest.mocked(tryOpenReportPopup).mockReturnValue(true);

      clickMenuItem(buildReportItem(true));

      expect(tryOpenReportPopup).toHaveBeenCalledTimes(1);
      expect(notifyReportPopupBlocked).not.toHaveBeenCalled();
      expect(openSpy).not.toHaveBeenCalled();
    });

    it("offers a manual retry when the modal popup is blocked", () => {
      jest.mocked(tryOpenReportPopup).mockReturnValue(false);

      clickMenuItem(buildReportItem(true));
      retryBlockedPopup();

      expect(tryOpenReportPopup).toHaveBeenCalledTimes(2);
    });

    it("opens non-modal processes in a new tab", () => {
      clickMenuItem(buildReportItem(false));

      expect(openSpy).toHaveBeenCalledWith(expect.any(String), "_blank");
      expect(notifyReportPopupBlocked).not.toHaveBeenCalled();
    });

    it("offers a manual retry when the new tab is blocked", () => {
      openSpy.mockReturnValue(null);

      clickMenuItem(buildReportItem(false));
      retryBlockedPopup();

      expect(openSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("keeps opening Window entries as windows", () => {
    clickMenuItem({ id: "MENU_WIN", name: "Sales Order", type: "Window", windowId: "143" });

    expect(mockOpenExternalMenuEntry).not.toHaveBeenCalled();
    const [opened] = Object.values(useWindowStore.getState().windows);
    expect(opened).toMatchObject({ windowId: "143", title: "Sales Order", isActive: true });
  });
});
