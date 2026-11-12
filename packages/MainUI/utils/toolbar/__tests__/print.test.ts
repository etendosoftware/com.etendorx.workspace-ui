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

import {
  BUSINESS_PARTNER_TAB_ID,
  PRINTER_REPORTS_LEGACY_PATH,
  buildLegacyPrintUrl,
  isEmailUnavailable,
  isPrintUnavailable,
  openLegacyPrintPopup,
} from "../print";
import {
  BPARTNER_PRINT_CONFIG,
  BPARTNER_TAB,
  ORDER_TAB,
  OTHER_SAVED_RECORD,
  SAVED_RECORD,
  UNSAVED_ROW,
} from "../test-utils/printFixtures";

const HOST = "https://host/etendo";
const RECORD_IDS = [String(SAVED_RECORD.id), String(OTHER_SAVED_RECORD.id)];

const buildUrl = (overrides: Partial<Parameters<typeof buildLegacyPrintUrl>[0]> = {}) =>
  new URL(
    buildLegacyPrintUrl({
      publicHost: HOST,
      tab: BPARTNER_TAB,
      printConfig: BPARTNER_PRINT_CONFIG,
      recordIds: RECORD_IDS,
      token: "jwt",
      ...overrides,
    })
  );

describe("isEmailUnavailable", () => {
  it("is available with a saved selected record", () => {
    expect(isEmailUnavailable({ tabId: ORDER_TAB.id, selectedRecords: [SAVED_RECORD], isNewRecord: false })).toBe(
      false
    );
  });

  it.each([
    ["nothing is selected", { selectedRecords: [], isNewRecord: false }],
    ["the record is new", { selectedRecords: [SAVED_RECORD], isNewRecord: true }],
    ["a selected row is not saved", { selectedRecords: [SAVED_RECORD, UNSAVED_ROW], isNewRecord: false }],
  ])("is unavailable when %s", (_label, params) => {
    expect(isEmailUnavailable({ tabId: ORDER_TAB.id, ...params })).toBe(true);
  });
});

describe("isPrintUnavailable", () => {
  const severalRecords = { selectedRecords: [SAVED_RECORD, OTHER_SAVED_RECORD], isNewRecord: false };

  it("allows several records in any tab but Business Partner", () => {
    expect(isPrintUnavailable({ tabId: ORDER_TAB.id, ...severalRecords })).toBe(false);
  });

  it("allows a single Business Partner", () => {
    expect(
      isPrintUnavailable({ tabId: BUSINESS_PARTNER_TAB_ID, selectedRecords: [SAVED_RECORD], isNewRecord: false })
    ).toBe(false);
  });

  it("blocks several Business Partners, as classic", () => {
    expect(isPrintUnavailable({ tabId: BUSINESS_PARTNER_TAB_ID, ...severalRecords })).toBe(true);
  });

  it("applies the Email rules", () => {
    expect(isPrintUnavailable({ tabId: ORDER_TAB.id, selectedRecords: [], isNewRecord: false })).toBe(true);
  });
});

describe("buildLegacyPrintUrl", () => {
  it("sends the classic PrinterReports parameters through the legacy forward", () => {
    const url = buildUrl();

    expect(`${url.origin}${url.pathname}`).toBe(`${HOST}/meta/legacy${PRINTER_REPORTS_LEGACY_PATH}`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      Command: "DEFAULT",
      inppdfpath: BPARTNER_PRINT_CONFIG.url,
      inphiddenkey: "inpcBpartnerId",
      inphiddenvalue: RECORD_IDS.join(","),
      inpdirectprint: "N",
      inpButtonType: "printButton",
      inpTabId: BPARTNER_TAB.id,
      inpwindowId: BPARTNER_TAB.window,
      token: "jwt",
    });
  });

  it("sends the direct print flag", () => {
    const url = buildUrl({ printConfig: { ...BPARTNER_PRINT_CONFIG, directPrint: true } });
    expect(url.searchParams.get("inpdirectprint")).toBe("Y");
  });

  it("omits the key and token when they are unknown", () => {
    const url = buildUrl({ printConfig: { ...BPARTNER_PRINT_CONFIG, keyParam: null }, token: null });
    expect(url.searchParams.has("inphiddenkey")).toBe(false);
    expect(url.searchParams.has("token")).toBe(false);
  });
});

describe("openLegacyPrintPopup", () => {
  const openSpy = jest.spyOn(window, "open");

  afterAll(() => openSpy.mockRestore());

  it("opens the print page in its own window", () => {
    openSpy.mockReturnValueOnce({} as Window);

    expect(openLegacyPrintPopup("https://popup")).toBe(true);
    expect(openSpy).toHaveBeenCalledWith("https://popup", expect.any(String), expect.stringContaining("width=900"));
  });

  it("returns false when the browser blocks the window", () => {
    openSpy.mockReturnValueOnce(null);

    expect(openLegacyPrintPopup("https://popup")).toBe(false);
  });
});
