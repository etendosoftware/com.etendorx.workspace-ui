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
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { buildRecordLookupParams, recordExists } from "../recordExists";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({ Metadata: { getWindow: jest.fn() } }));
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({ datasource: { get: jest.fn() } }));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn() } }));

const TARGET = { windowId: "143", tabId: "186", recordId: "REC-1" };
const ENTITY_NAME = "Order";

const mockWindow = (tabs: Array<{ id: string; entityName?: string }>) =>
  (Metadata.getWindow as jest.Mock).mockResolvedValue({ tabs });
const mockDatasource = (answer: unknown) => (datasource.get as jest.Mock).mockResolvedValue(answer);

describe("recordExists (ETP-6431)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindow([{ id: TARGET.tabId, entityName: ENTITY_NAME }]);
  });

  it("reads the record by id without the implicit filter and with inactive records", () => {
    expect(buildRecordLookupParams(TARGET)).toEqual({
      windowId: TARGET.windowId,
      tabId: TARGET.tabId,
      criteria: [{ fieldName: "id", operator: "equals", value: TARGET.recordId }],
      noActiveFilter: "true",
      startRow: "0",
      endRow: "0",
    });
  });

  it("is true when the datasource answers the record", async () => {
    mockDatasource({ ok: true, data: { response: { data: [{ id: TARGET.recordId }] } } });

    await expect(recordExists(TARGET)).resolves.toBe(true);
    expect(datasource.get).toHaveBeenCalledWith(ENTITY_NAME, buildRecordLookupParams(TARGET));
  });

  it("is false when the datasource answers no rows", async () => {
    mockDatasource({ ok: true, data: { response: { data: [] } } });

    await expect(recordExists(TARGET)).resolves.toBe(false);
  });

  it.each([
    ["the request fails", { ok: false, data: {} }],
    ["the answer carries no rows", { ok: true, data: { response: { status: -1 } } }],
  ])("is true when %s, so the record opens as before", async (_case, answer) => {
    mockDatasource(answer);

    await expect(recordExists(TARGET)).resolves.toBe(true);
  });

  it("is true without asking the datasource when the tab is unknown", async () => {
    mockWindow([{ id: "other-tab", entityName: ENTITY_NAME }]);

    await expect(recordExists(TARGET)).resolves.toBe(true);
    expect(datasource.get).not.toHaveBeenCalled();
  });

  it("is true when the window metadata cannot be read", async () => {
    (Metadata.getWindow as jest.Mock).mockRejectedValue(new Error("down"));

    await expect(recordExists(TARGET)).resolves.toBe(true);
  });
});
