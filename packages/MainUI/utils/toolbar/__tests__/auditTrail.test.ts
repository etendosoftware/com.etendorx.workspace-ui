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

import type { EntityData } from "@workspaceui/api-client/src/api/types";
import {
  AUDIT_TRAIL_LEGACY_PATH,
  AUDIT_TRAIL_STATUS,
  buildAuditTrailUrl,
  getAuditTrailStatus,
  isRecordModified,
  openAuditTrailPopup,
} from "../auditTrail";
import { MODIFIED_RECORD, UNMODIFIED_RECORD } from "../test-utils/auditTrailFixtures";

describe("isRecordModified", () => {
  it("returns true when updated differs from creationDate", () => {
    expect(isRecordModified(MODIFIED_RECORD)).toBe(true);
  });

  it("returns false when updated equals creationDate", () => {
    expect(isRecordModified(UNMODIFIED_RECORD)).toBe(false);
  });

  it.each([
    ["no record", undefined],
    ["null record", null],
    ["missing timestamps", { id: "new-row" }],
    ["empty updated", { ...UNMODIFIED_RECORD, updated: "" }],
    ["unparsable updated", { ...UNMODIFIED_RECORD, updated: "not a date" }],
  ])("returns false for %s", (_label, record) => {
    expect(isRecordModified(record as EntityData | null | undefined)).toBe(false);
  });
});

describe("getAuditTrailStatus", () => {
  it("is READY for a single modified record", () => {
    expect(getAuditTrailStatus({ selectedRecords: [MODIFIED_RECORD], isNewRecord: false })).toBe(
      AUDIT_TRAIL_STATUS.READY
    );
  });

  it("is MULTIPLE when more than one record is selected", () => {
    expect(getAuditTrailStatus({ selectedRecords: [MODIFIED_RECORD, UNMODIFIED_RECORD], isNewRecord: false })).toBe(
      AUDIT_TRAIL_STATUS.MULTIPLE
    );
  });

  it.each([
    ["no selection", [], false],
    ["a new unsaved record", [MODIFIED_RECORD], true],
    ["a never modified record", [UNMODIFIED_RECORD], false],
  ])("is UNAVAILABLE with %s", (_label, selectedRecords, isNewRecord) => {
    expect(getAuditTrailStatus({ selectedRecords: selectedRecords as EntityData[], isNewRecord })).toBe(
      AUDIT_TRAIL_STATUS.UNAVAILABLE
    );
  });
});

describe("buildAuditTrailUrl", () => {
  const baseParams = { publicHost: "http://host/etendo", tabId: "tab-1", tableId: "table-1", recordId: "rec-1" };

  const parse = (url: string) => new URL(url);

  it("targets the classic popup through the legacy forward with the history command", () => {
    const url = parse(buildAuditTrailUrl({ ...baseParams, token: "jwt" }));
    expect(url.pathname).toBe(`/etendo/meta/legacy${AUDIT_TRAIL_LEGACY_PATH}`);
    expect(url.searchParams.get("Command")).toBe("POPUP_HISTORY");
    expect(url.searchParams.get("inpTabId")).toBe("tab-1");
    expect(url.searchParams.get("inpTableId")).toBe("table-1");
    expect(url.searchParams.get("inpRecordId")).toBe("rec-1");
    expect(url.searchParams.get("token")).toBe("jwt");
  });

  it("sends the browser time zone offset", () => {
    const url = parse(buildAuditTrailUrl(baseParams));
    expect(url.searchParams.get("inpClientTZOffset")).toBe(String(new Date().getTimezoneOffset()));
  });

  it.each([undefined, null, ""])("omits the token when it is %p", (token) => {
    const url = parse(buildAuditTrailUrl({ ...baseParams, token }));
    expect(url.searchParams.has("token")).toBe(false);
  });
});

describe("openAuditTrailPopup", () => {
  const openSpy = jest.spyOn(window, "open");

  afterAll(() => openSpy.mockRestore());

  it("opens the popup in its own 900x600 window", () => {
    openSpy.mockReturnValueOnce({} as Window);

    expect(openAuditTrailPopup("http://popup")).toBe(true);
    expect(openSpy).toHaveBeenCalledWith(
      "http://popup",
      expect.any(String),
      expect.stringContaining("width=900,height=600")
    );
  });

  it("returns false when the browser blocks the window", () => {
    openSpy.mockReturnValueOnce(null);

    expect(openAuditTrailPopup("http://popup")).toBe(false);
  });
});
