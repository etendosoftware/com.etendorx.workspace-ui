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

import { formatBrowserDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { resolveTypedDateFilter } from "../dateColumnFilter";

describe("resolveTypedDateFilter", () => {
  it("returns an empty value for empty text, which clears the filter", () => {
    expect(resolveTypedDateFilter("   ")).toBe("");
  });

  it("converts a date in the user's format to YYYY-MM-DD", () => {
    expect(resolveTypedDateFilter(formatBrowserDate(new Date(2026, 9, 13)))).toBe("2026-10-13");
  });

  it("accepts an ISO date", () => {
    expect(resolveTypedDateFilter(" 2026-10-13 ")).toBe("2026-10-13");
  });

  it.each([">=01/10/2026", "!2026-10-13", "01/10/2026 - 31/10/2026", "2026-10-01 | 2026-10-05", "a and b"])(
    "sends the expression %p as typed",
    (expression) => {
      expect(resolveTypedDateFilter(expression)).toBe(expression);
    }
  );

  it.each(["31/02/2026", "abc", "#", "13/10/26"])("returns null for the invalid date %p", (text) => {
    expect(resolveTypedDateFilter(text)).toBeNull();
  });
});
