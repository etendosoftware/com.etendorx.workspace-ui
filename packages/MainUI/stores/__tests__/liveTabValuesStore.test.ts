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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useLiveTabValuesStore, type LiveTabValues } from "../liveTabValuesStore";

const WINDOW_IDENTIFIER = "win-1";
const TAB_ID = "tab-1";
const RECORD_ID = "R1";
const ENTRY: LiveTabValues = { recordId: RECORD_ID, values: { hasRegion: true } };

const getEntries = () => useLiveTabValuesStore.getState().entries;
const publish = (entry: LiveTabValues, tabId = TAB_ID) =>
  useLiveTabValuesStore.getState().publishTabValues(WINDOW_IDENTIFIER, tabId, entry);
const clear = (tabId = TAB_ID) => useLiveTabValuesStore.getState().clearTabValues(WINDOW_IDENTIFIER, tabId);

describe("liveTabValuesStore", () => {
  beforeEach(() => {
    useLiveTabValuesStore.setState({ entries: {} });
  });

  it("publishes the values of a tab under its window", () => {
    publish(ENTRY);

    expect(getEntries()[WINDOW_IDENTIFIER][TAB_ID]).toEqual(ENTRY);
  });

  it("keeps the other tabs of the window when publishing", () => {
    publish(ENTRY, "other-tab");
    publish(ENTRY);

    expect(Object.keys(getEntries()[WINDOW_IDENTIFIER])).toEqual(["other-tab", TAB_ID]);
  });

  it("does not change the state when the same values are published again", () => {
    publish(ENTRY);
    const entriesBefore = getEntries();

    publish({ recordId: RECORD_ID, values: { hasRegion: true } });

    expect(getEntries()).toBe(entriesBefore);
  });

  it.each([
    ["the record changes", { recordId: "R2", values: { hasRegion: true } }],
    ["a value changes", { recordId: RECORD_ID, values: { hasRegion: false } }],
    ["a field is added", { recordId: RECORD_ID, values: { hasRegion: true, name: "Spain" } }],
  ])("replaces the entry when %s", (_case, nextEntry) => {
    publish(ENTRY);

    publish(nextEntry);

    expect(getEntries()[WINDOW_IDENTIFIER][TAB_ID]).toEqual(nextEntry);
  });

  it("clears the values of a tab", () => {
    publish(ENTRY);

    clear();

    expect(getEntries()[WINDOW_IDENTIFIER][TAB_ID]).toBeUndefined();
  });

  it("does not change the state when clearing a tab without values", () => {
    const entriesBefore = getEntries();

    clear();

    expect(getEntries()).toBe(entriesBefore);
  });
});
