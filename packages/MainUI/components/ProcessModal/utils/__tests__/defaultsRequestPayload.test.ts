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

import { createMockField, createMockTab } from "@/utils/tests/mockHelpers";
import { buildDefaultsRequestPayload } from "../defaultsRequestPayload";

const WINDOW_ID = "94EAA455D2644E04AB25D93BE5157B6D";
const KEY_INPUT = "inpfinFinancialAccountId";

const tab = createMockTab({
  id: "2845D761A8394468BD3BA4710AA888D4",
  window: WINDOW_ID,
  fields: {
    id: createMockField({ hqlName: "id", columnName: "Fin_Financial_Account_ID", inputName: KEY_INPUT }),
  },
});

describe("buildDefaultsRequestPayload", () => {
  it("sends the launching tab's standard context with the record values and the session", () => {
    const payload = buildDefaultsRequestPayload(tab, { id: "FA-1" }, { inpname: "Bank" }, { "#AD_Org_ID": "0" });

    expect(payload).toEqual(
      expect.objectContaining({
        inpwindowId: WINDOW_ID,
        inpTabId: tab.id,
        Fin_Financial_Account_ID: "FA-1",
        inpname: "Bank",
        "#AD_Org_ID": "0",
      })
    );
  });

  it("keeps the record values and the session over the tab context", () => {
    const payload = buildDefaultsRequestPayload(
      tab,
      { id: "FA-1" },
      { [KEY_INPUT]: "FROM-RECORD" },
      {
        inpwindowId: "FROM-SESSION",
      }
    );

    expect(payload[KEY_INPUT]).toBe("FROM-RECORD");
    expect(payload.inpwindowId).toBe("FROM-SESSION");
  });

  it("sends only the record values and the session without a launching tab", () => {
    expect(buildDefaultsRequestPayload(undefined, null, { inpname: "Bank" }, {})).toEqual({ inpname: "Bank" });
  });

  it("builds the tab context without a selected record", () => {
    expect(buildDefaultsRequestPayload(tab, null, null, {})).toEqual(
      expect.objectContaining({ inpwindowId: WINDOW_ID })
    );
  });

  it("adds the nested launch's externalParams on top", () => {
    const payload = buildDefaultsRequestPayload(tab, { id: "FA-1" }, null, {}, { bankStatementLineId: "BSL-1" });

    expect(payload).toEqual(expect.objectContaining({ inpwindowId: WINDOW_ID, bankStatementLineId: "BSL-1" }));
  });
});
