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

import { formatRecordCount, MORE_RECORDS_SUFFIX } from "../formatRecordCount";

describe("formatRecordCount", () => {
  it("shows the exact count once every record is loaded", () => {
    expect(formatRecordCount(119)).toBe("119");
    expect(formatRecordCount(119, false)).toBe("119");
  });

  it("marks the loaded count as partial while more records exist", () => {
    expect(formatRecordCount(101, true)).toBe(`101${MORE_RECORDS_SUFFIX}`);
  });
});
