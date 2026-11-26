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

import { getFailureStatus } from "../sessionFailureStatus";

describe("getFailureStatus", () => {
  it("keeps the 401 of an invalid, expired or revoked token", () => {
    expect(getFailureStatus({ status: 401 })).toBe(401);
  });

  it.each([403, 500, undefined])("answers 500 for any other failure (ERP status %p)", (status) => {
    expect(getFailureStatus({ status })).toBe(500);
  });
});
