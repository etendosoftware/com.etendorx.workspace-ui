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

import { act, renderHook } from "@testing-library/react";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useRecentItems } from "../useRecentItems";

const ROLE_ID = "ROLE_ID";
const EXTERNAL_ID = "A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6";

const buildExternalEntry = (overrides: Partial<Menu> = {}): Menu => ({
  id: EXTERNAL_ID,
  name: "TEST External",
  type: "External",
  url: "example.com",
  openLinkInBrowser: true,
  ...overrides,
});

const renderRecentItems = (menuItems: Menu[], onClick = jest.fn()) =>
  renderHook(() => useRecentItems(menuItems, onClick, ROLE_ID));

describe("useRecentItems with External menu entries", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores the URL and the open-in-browser flag, so the stored item can be reopened", () => {
    const { result } = renderRecentItems([]);

    act(() => {
      result.current.addRecentItem(buildExternalEntry());
    });

    expect(result.current.localRecentItems[0]).toMatchObject({
      id: EXTERNAL_ID,
      type: "External",
      url: "example.com",
      openLinkInBrowser: true,
    });
  });

  it("reopens the live menu entry, matched by id, when it is still in the menu", () => {
    const onClick = jest.fn();
    const liveEntry = buildExternalEntry({ url: "new.example.com" });
    const menu: Menu[] = [{ id: "FOLDER", name: "Folder", type: "Summary", children: [liveEntry] }];
    const { result } = renderRecentItems(menu, onClick);

    act(() => {
      result.current.handleRecentItemClick(buildExternalEntry({ url: "old.example.com" }));
    });

    expect(onClick).toHaveBeenCalledWith(liveEntry);
  });
});
