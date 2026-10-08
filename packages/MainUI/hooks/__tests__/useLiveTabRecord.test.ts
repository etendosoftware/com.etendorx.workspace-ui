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

import { act, renderHook } from "@testing-library/react";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useLiveTabRecord } from "../useLiveTabRecord";
import { useLiveTabValuesStore } from "@/stores/liveTabValuesStore";

const WINDOW_IDENTIFIER = "win-1";
const RECORD_ID = "R1";
let mockWindowIdentifier = WINDOW_IDENTIFIER;

jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowIdentifier: () => mockWindowIdentifier,
}));

const TAB = { id: "tab-1" } as Tab;
const RECORD = { id: RECORD_ID, hasRegion: true, name: "Spain" } as EntityData;

const publish = (recordId: string, values: Record<string, unknown>) =>
  act(() => {
    useLiveTabValuesStore.getState().publishTabValues(WINDOW_IDENTIFIER, TAB.id, { recordId, values });
  });

const renderLiveRecord = (tab: Tab | null, record: EntityData | undefined) =>
  renderHook(() => useLiveTabRecord(tab, record));

describe("useLiveTabRecord", () => {
  beforeEach(() => {
    mockWindowIdentifier = WINDOW_IDENTIFIER;
    useLiveTabValuesStore.setState({ entries: {} });
  });

  it("returns the record as-is when the tab has no live values", () => {
    const { result } = renderLiveRecord(TAB, RECORD);

    expect(result.current).toBe(RECORD);
  });

  it("overlays the live values published for the same record", () => {
    const { result } = renderLiveRecord(TAB, RECORD);

    publish(RECORD_ID, { hasRegion: false });

    expect(result.current).toEqual({ id: RECORD_ID, hasRegion: false, name: "Spain" });
  });

  it("ignores live values published for another record", () => {
    publish("R2", { hasRegion: false });

    const { result } = renderLiveRecord(TAB, RECORD);

    expect(result.current).toBe(RECORD);
  });

  it("returns undefined when there is no selected record", () => {
    publish(RECORD_ID, { hasRegion: false });

    const { result } = renderLiveRecord(TAB, undefined);

    expect(result.current).toBeUndefined();
  });

  it("returns the record when there is no tab or window to read from", () => {
    publish(RECORD_ID, { hasRegion: false });
    mockWindowIdentifier = "";

    expect(renderLiveRecord(TAB, RECORD).result.current).toBe(RECORD);
    expect(renderLiveRecord(null, RECORD).result.current).toBe(RECORD);
  });
});
