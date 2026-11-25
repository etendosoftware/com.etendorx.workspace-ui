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
import { calculateHierarchy } from "@/utils/recovery/hierarchyCalculator";
import { reconstructState } from "@/utils/recovery/stateReconstructor";
import { buildRecordWindowData } from "../recordWindowData";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({ Metadata: { getWindow: jest.fn() } }));
jest.mock("@/utils/recovery/hierarchyCalculator", () => ({ calculateHierarchy: jest.fn() }));
jest.mock("@/utils/recovery/stateReconstructor", () => ({ reconstructState: jest.fn() }));

const TARGET = {
  windowIdentifier: "143_1",
  windowId: "143",
  tabId: "187",
  title: "Sales Order",
  recordId: "LINE-1",
  tabLevel: 1,
};

describe("buildRecordWindowData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns the reconstructed tabs and navigation of the record", async () => {
    const windowMetadata = { tabs: [{ id: TARGET.tabId, tabLevel: 2 }] };
    const reconstructed = { tabs: { [TARGET.tabId]: {} }, navigation: { activeLevels: [0, 1] } };
    (Metadata.getWindow as jest.Mock).mockResolvedValue(windowMetadata);
    (calculateHierarchy as jest.Mock).mockResolvedValue({});
    (reconstructState as jest.Mock).mockResolvedValue(reconstructed);

    const result = await buildRecordWindowData(TARGET);

    expect(calculateHierarchy).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: TARGET.recordId, tabLevel: 2, windowId: TARGET.windowId }),
      windowMetadata
    );
    expect(result).toEqual({ title: TARGET.title, ...reconstructed, initialized: true });
  });

  it("falls back to the record in the form of the target tab when the reconstruction fails", async () => {
    (Metadata.getWindow as jest.Mock).mockRejectedValue(new Error("down"));

    const result = await buildRecordWindowData(TARGET);

    expect(result.title).toBe(TARGET.title);
    expect(result.tabs?.[TARGET.tabId]).toEqual(
      expect.objectContaining({
        level: TARGET.tabLevel,
        selectedRecord: TARGET.recordId,
        form: { recordId: TARGET.recordId, mode: "form", formMode: "edit" },
      })
    );
  });
});
