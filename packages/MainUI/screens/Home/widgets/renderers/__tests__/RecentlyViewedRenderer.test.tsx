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

import { fireEvent, render, screen } from "@testing-library/react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { RecentItem } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import RecentlyViewedRenderer from "../RecentlyViewedRenderer";
import { useWindowStore } from "@/stores/windowStore";

const ROLE_ID = "ROLE_ID";
const EXTERNAL_ID = "A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6";
const WINDOW_ID = "143";

const mockOpenExternalMenuEntry = jest.fn();
let mockStoredItems: Record<string, RecentItem[]> = {};

jest.mock("@workspaceui/componentlibrary/src/hooks/useLocalStorage", () => ({
  useLocalStorage: () => [mockStoredItems],
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: unknown) => unknown) => selector({ currentRole: { id: "ROLE_ID" } }),
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

const clickItem = (id: string) => fireEvent.click(screen.getByTestId(`RecentlyViewedRenderer__item_${id}`));

describe("RecentlyViewedRenderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.getState().cleanState();
    mockStoredItems = { [ROLE_ID]: [externalItem, windowItem] };
    jest.mocked(Metadata.getCachedMenu).mockReturnValue([]);
  });

  it("shows the empty message when there are no recent items", () => {
    mockStoredItems = {};
    render(<RecentlyViewedRenderer />);

    expect(screen.getByTestId("RecentlyViewedRenderer__empty")).toBeInTheDocument();
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

  it("keeps opening the other items as windows", () => {
    render(<RecentlyViewedRenderer />);

    clickItem("MENU_WIN");

    expect(mockOpenExternalMenuEntry).not.toHaveBeenCalled();
    const [opened] = Object.values(useWindowStore.getState().windows);
    expect(opened).toMatchObject({ windowId: WINDOW_ID, title: "Sales Order", isActive: true });
  });
});
