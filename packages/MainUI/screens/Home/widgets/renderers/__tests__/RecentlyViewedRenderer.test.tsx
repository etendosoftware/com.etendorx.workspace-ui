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

import { fireEvent, render, screen } from "@testing-library/react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { RecentItem } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import RecentlyViewedRenderer from "@/screens/Home/widgets/renderers/RecentlyViewedRenderer";
import { useRecentItemsStore } from "@/stores/recentItemsStore";
import { useWindowStore } from "@/stores/windowStore";
import { ROLE_ID, setUserSession } from "@/test-utils/recentItems";

const EXTERNAL_ID = "A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6";
const WINDOW_ID = "143";
const EMPTY_TEST_ID = "RecentlyViewedRenderer__empty";

const mockOpenExternalMenuEntry = jest.fn();

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/hooks/useOpenExternalMenuEntry", () => ({
  useOpenExternalMenuEntry: () => mockOpenExternalMenuEntry,
}));

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { getCachedMenu: jest.fn() },
}));

const externalItem: RecentItem = {
  id: EXTERNAL_ID,
  name: "TEST External",
  windowId: EXTERNAL_ID,
  type: "External",
  url: "old.example.com",
  openLinkInBrowser: false,
};

const windowItem: RecentItem = { id: "MENU_WIN", name: "Sales Order", windowId: WINDOW_ID, type: "Window" };

const FORM_MENU_ID = "MENUFORM";
const MODULE_FORM_URL = "/com.example.module.ad_forms/ModuleForm.html";
const formItem: RecentItem = { id: FORM_MENU_ID, name: "Module Form", windowId: FORM_MENU_ID, type: "Form" };
const liveFormEntry = { id: FORM_MENU_ID, name: "Module Form", type: "Form", formId: "F1", formUrl: MODULE_FORM_URL };
const PROCESS_MENU_ID = "MENUPROC";
const processItem: RecentItem = { id: PROCESS_MENU_ID, name: "Process", windowId: PROCESS_MENU_ID, type: "Process" };
const liveProcessEntry = { id: PROCESS_MENU_ID, name: "Process", type: "Process", processId: "P1" };

/** Window id of the single window opened by the widget, if any. */
const getOpenedWindowId = () => Object.values(useWindowStore.getState().windows)[0]?.windowId;

const clickItem = (id: string) => fireEvent.click(screen.getByTestId(`RecentlyViewedRenderer__item_${id}`));

describe("RecentlyViewedRenderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.getState().cleanState();
    useRecentItemsStore.setState({ items: [externalItem, windowItem, formItem, processItem] });
    setUserSession(ROLE_ID);
    jest.mocked(Metadata.getCachedMenu).mockReturnValue([]);
  });

  it("shows the empty message when there are no recent items", () => {
    useRecentItemsStore.setState({ items: [] });
    render(<RecentlyViewedRenderer />);

    expect(screen.getByTestId(EMPTY_TEST_ID)).toBeInTheDocument();
  });

  it("shows the empty message while there is no role", () => {
    setUserSession(undefined);
    render(<RecentlyViewedRenderer />);

    expect(screen.getByTestId(EMPTY_TEST_ID)).toBeInTheDocument();
  });

  it("opens External items with the live menu entry when it is still in the menu", () => {
    const liveEntry = { id: EXTERNAL_ID, name: "TEST External", type: "External", url: "example.com" };
    jest.mocked(Metadata.getCachedMenu).mockReturnValue([liveEntry]);
    render(<RecentlyViewedRenderer />);

    clickItem(EXTERNAL_ID);

    expect(mockOpenExternalMenuEntry).toHaveBeenCalledWith(liveEntry);
    expect(useWindowStore.getState().windows).toEqual({});
  });

  it("falls back to the stored External item when the menu does not have it", () => {
    render(<RecentlyViewedRenderer />);

    clickItem(EXTERNAL_ID);

    expect(mockOpenExternalMenuEntry).toHaveBeenCalledWith(externalItem);
  });

  it("opens the other server-side recent items as windows", () => {
    render(<RecentlyViewedRenderer />);

    clickItem("MENU_WIN");

    expect(mockOpenExternalMenuEntry).not.toHaveBeenCalled();
    const [opened] = Object.values(useWindowStore.getState().windows);
    expect(opened).toMatchObject({ windowId: WINDOW_ID, title: "Sales Order", isActive: true });
  });

  describe("entries served by Etendo Classic", () => {
    let openSpy: jest.SpyInstance;

    beforeEach(() => {
      openSpy = jest.spyOn(window, "open").mockReturnValue({ closed: false } as Window);
    });

    afterEach(() => {
      openSpy.mockRestore();
    });

    it("opens a form in its Classic popup with the address of the live menu entry", () => {
      jest.mocked(Metadata.getCachedMenu).mockReturnValue([liveFormEntry, liveProcessEntry]);
      render(<RecentlyViewedRenderer />);

      clickItem(FORM_MENU_ID);

      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining(`url=${MODULE_FORM_URL}&`),
        "Test",
        "width=950,height=700"
      );
      expect(useWindowStore.getState().windows).toEqual({});
    });

    it("keeps the previous navigation when the form is no longer in the menu", () => {
      render(<RecentlyViewedRenderer />);

      clickItem(FORM_MENU_ID);

      expect(openSpy).not.toHaveBeenCalled();
      expect(getOpenedWindowId()).toBe(FORM_MENU_ID);
    });

    it("leaves process-like entries, which need the menu process modal, to the previous navigation", () => {
      jest.mocked(Metadata.getCachedMenu).mockReturnValue([liveFormEntry, liveProcessEntry]);
      render(<RecentlyViewedRenderer />);

      clickItem(PROCESS_MENU_ID);

      expect(openSpy).not.toHaveBeenCalled();
      expect(getOpenedWindowId()).toBe(PROCESS_MENU_ID);
    });
  });
});
