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

import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { recoverExternalPageWindow } from "../externalPageRecovery";
import { buildExternalPageWindowId } from "@/utils/menu/externalMenuEntry";
import type { WindowRecoveryInfo } from "@/utils/window/constants";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { getMenu: jest.fn() },
}));

const MENU_ID = "A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6";
const MENU_NAME = "TEST External";

const recoveryInfo: WindowRecoveryInfo = {
  windowIdentifier: `${buildExternalPageWindowId(MENU_ID)}_1700000000000`,
  hasRecoveryData: false,
};

const buildExternalEntry = (overrides: Partial<Menu> = {}): Menu => ({
  id: MENU_ID,
  name: MENU_NAME,
  type: "External",
  url: "example.com",
  ...overrides,
});

const mockMenu = (menu: Menu[]) => jest.mocked(Metadata.getMenu).mockResolvedValue(menu);

describe("recoverExternalPageWindow", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("rebuilds the tab with the URL and title resolved from the menu", async () => {
    mockMenu([{ id: "FOLDER", name: "Folder", type: "Summary", children: [buildExternalEntry()] }]);

    const state = await recoverExternalPageWindow(recoveryInfo);

    expect(state).toMatchObject({
      windowId: buildExternalPageWindowId(MENU_ID),
      windowIdentifier: recoveryInfo.windowIdentifier,
      title: MENU_NAME,
      initialized: true,
      externalUrl: "http://example.com",
    });
  });

  it.each([
    ["the entry is no longer in the menu", []],
    ["the entry has no usable URL", [buildExternalEntry({ url: null })]],
  ])("drops the tab when %s", async (_label, menu) => {
    mockMenu(menu);
    expect(await recoverExternalPageWindow(recoveryInfo)).toBeNull();
  });

  it("drops the tab when the menu cannot be loaded", async () => {
    jest.mocked(Metadata.getMenu).mockRejectedValue(new Error("network"));

    expect(await recoverExternalPageWindow(recoveryInfo)).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});
