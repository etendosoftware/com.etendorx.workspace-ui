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
import { buildSourceView } from "../sourceView";

const RECORD_ID = "FA-1";
const KEY_COLUMN = "Fin_Financial_Account_ID";
const KEY_INPUT = "inpfinFinancialAccountId";

const tab = createMockTab({
  id: "2845D761A8394468BD3BA4710AA888D4",
  window: "94EAA455D2644E04AB25D93BE5157B6D",
  table: "B129E53BC0E747879F7BA17F0AECEC32",
  entityName: "FIN_Financial_Account",
  fields: {
    id: createMockField({ hqlName: "id", columnName: KEY_COLUMN, inputName: KEY_INPUT }),
  },
});

describe("buildSourceView", () => {
  it.each([undefined, null])("returns undefined when there is no launching tab (%p)", (missingTab) => {
    expect(buildSourceView(missingTab, { id: RECORD_ID })).toBeUndefined();
  });

  it("keeps every property of the launching tab", () => {
    expect(buildSourceView(tab, { id: RECORD_ID })).toEqual(expect.objectContaining(tab));
  });

  it("exposes the classic context of the selected record, keyed by the key column name", () => {
    const context = buildSourceView(tab, { id: RECORD_ID })?.getContextInfo();

    expect(context).toEqual(
      expect.objectContaining({
        [KEY_COLUMN]: RECORD_ID,
        [KEY_INPUT]: RECORD_ID,
        inpKeyName: KEY_INPUT,
        keyColumnName: KEY_COLUMN,
        inpTabId: tab.id,
        inpwindowId: tab.window,
        inpTableId: tab.table,
      })
    );
  });

  it("builds the context without a selected record", () => {
    const context = buildSourceView(tab, null)?.getContextInfo();

    expect(context).toEqual(expect.objectContaining({ inpTabId: tab.id, keyColumnName: KEY_COLUMN }));
  });
});
