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

import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useWindowStore } from "@/stores/windowStore";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { openStartPage, parseStartPageTabId } from "../startPage";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({ Metadata: { getTab: jest.fn() } }));
jest.mock("@/stores/windowStore", () => ({ useWindowStore: { getState: jest.fn() } }));

const TAB_ID = "186";
const setWindowActive = jest.fn();

describe("parseStartPageTabId", () => {
  it.each([
    [`/?tabId=${TAB_ID}`, TAB_ID],
    [`/?tabId=${TAB_ID}&recordId=1`, TAB_ID],
    [`?command=NEW&tabId=${TAB_ID}`, TAB_ID],
  ])("reads the tab of %s", (value, expected) => {
    expect(parseStartPageTabId(value)).toBe(expected);
  });

  it.each([undefined, "", "/security/Menu.html", "/?recordId=1", "/?tabId="])("ignores %p", (value) => {
    expect(parseStartPageTabId(value)).toBeNull();
  });
});

describe("openStartPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installLocalStorageMock();
    (useWindowStore.getState as jest.Mock).mockReturnValue({ setWindowActive });
  });

  it("opens the window of the start page tab as the menu does", async () => {
    savePreferences({ StartPage: `/?tabId=${TAB_ID}` });
    (Metadata.getTab as jest.Mock).mockResolvedValue({
      id: TAB_ID,
      window: "143",
      window$_identifier: "Sales Order",
      title: "Header",
    });

    await openStartPage();

    expect(Metadata.getTab).toHaveBeenCalledWith(TAB_ID);
    expect(setWindowActive).toHaveBeenCalledWith({
      windowIdentifier: expect.stringMatching(/^143_/),
      windowData: { title: "Sales Order", initialized: true },
    });
  });

  it("does nothing without a start page", async () => {
    savePreferences({});
    await openStartPage();
    expect(Metadata.getTab).not.toHaveBeenCalled();
    expect(setWindowActive).not.toHaveBeenCalled();
  });

  it("keeps the home page when the tab cannot be loaded", async () => {
    savePreferences({ StartPage: `/?tabId=${TAB_ID}` });
    (Metadata.getTab as jest.Mock).mockRejectedValue(new Error("403"));
    await expect(openStartPage()).resolves.toBeUndefined();
    expect(setWindowActive).not.toHaveBeenCalled();
  });
});
