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
import { buildRecordWindowData } from "@/utils/window/recordWindowData";
import { openStartPage, parseStartPage } from "../startPage";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { getTab: jest.fn(), getWindow: jest.fn() },
}));
jest.mock("@/stores/windowStore", () => ({ useWindowStore: { getState: jest.fn() } }));
jest.mock("@/utils/window/recordWindowData", () => ({ buildRecordWindowData: jest.fn() }));

const TAB_ID = "186";
const CHILD_TAB_ID = "187";
const WINDOW_ID = "143";
const WINDOW_TITLE = "Sales Order";
const RECORD_ID = "ABC123";
const setWindowActive = jest.fn();

/** Stores the start page and serves the tab it points at. */
const givenStartPage = (value: string, tabLevel = 0) => {
  savePreferences({ StartPage: value });
  (Metadata.getTab as jest.Mock).mockResolvedValue({
    id: tabLevel === 0 ? TAB_ID : CHILD_TAB_ID,
    window: WINDOW_ID,
    window$_identifier: WINDOW_TITLE,
    title: "Header",
    tabLevel,
  });
};

/** The `windowData` the last `setWindowActive` call received. */
const openedWindowData = () => setWindowActive.mock.calls[0][0].windowData;

describe("parseStartPage", () => {
  it.each([
    [`/?tabId=${TAB_ID}`, { tabId: TAB_ID, recordId: undefined, isNewRecord: false }],
    [`/?tabId=${TAB_ID}&recordId=${RECORD_ID}`, { tabId: TAB_ID, recordId: RECORD_ID, isNewRecord: false }],
    [`?command=NEW&tabId=${TAB_ID}`, { tabId: TAB_ID, recordId: undefined, isNewRecord: true }],
    [`/?tabId=${TAB_ID}&command=DEFAULT`, { tabId: TAB_ID, recordId: undefined, isNewRecord: false }],
  ])("reads %s", (value, expected) => {
    expect(parseStartPage(value)).toEqual(expected);
  });

  it.each([undefined, "", "/security/Menu.html", "/?recordId=1", "/?tabId="])("ignores %p", (value) => {
    expect(parseStartPage(value)).toBeNull();
  });
});

describe("openStartPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installLocalStorageMock();
    (useWindowStore.getState as jest.Mock).mockReturnValue({ windows: {}, dirtyWindows: {}, setWindowActive });
  });

  it("opens the window of the start page tab as the menu does", async () => {
    givenStartPage(`/?tabId=${TAB_ID}`);

    await openStartPage();

    expect(Metadata.getTab).toHaveBeenCalledWith(TAB_ID);
    expect(setWindowActive).toHaveBeenCalledWith({
      windowIdentifier: expect.stringMatching(new RegExp(`^${WINDOW_ID}_`)),
      windowData: { title: WINDOW_TITLE, initialized: true },
    });
  });

  it("opens the record of recordId with the recovery reconstruction", async () => {
    givenStartPage(`/?tabId=${CHILD_TAB_ID}&recordId=${RECORD_ID}`, 1);
    const recordWindowData = { title: WINDOW_TITLE, tabs: {}, initialized: true };
    (buildRecordWindowData as jest.Mock).mockResolvedValue(recordWindowData);

    await openStartPage();

    expect(buildRecordWindowData).toHaveBeenCalledWith(
      expect.objectContaining({ windowId: WINDOW_ID, tabId: CHILD_TAB_ID, recordId: RECORD_ID, tabLevel: 1 })
    );
    expect(openedWindowData()).toBe(recordWindowData);
  });

  it("opens a new record in the top tab with command NEW, whatever tab is named", async () => {
    givenStartPage(`/?tabId=${CHILD_TAB_ID}&command=NEW`, 1);
    (Metadata.getWindow as jest.Mock).mockResolvedValue({
      tabs: [
        { id: CHILD_TAB_ID, tabLevel: 1 },
        { id: TAB_ID, tabLevel: 0 },
      ],
    });

    await openStartPage();

    expect(openedWindowData().tabs[TAB_ID].form).toEqual({ recordId: "new", mode: "form", formMode: "new" });
    expect(openedWindowData().tabs[CHILD_TAB_ID]).toBeUndefined();
  });

  it("opens the window as the menu does when it has no top tab", async () => {
    givenStartPage(`/?tabId=${TAB_ID}&command=NEW`);
    (Metadata.getWindow as jest.Mock).mockResolvedValue({ tabs: [] });

    await openStartPage();

    expect(openedWindowData()).toEqual({ title: WINDOW_TITLE, initialized: true });
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
