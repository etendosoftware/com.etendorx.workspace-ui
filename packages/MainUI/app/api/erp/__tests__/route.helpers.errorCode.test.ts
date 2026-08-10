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

import { buildErpErrorCodeHeaders } from "../[...slug]/route.helpers";
import { DEFAULT_PASSWORD_EXPIRED_ERROR, ERP_ERROR_CODE_HEADER } from "@/utils/session/constants";

const EXPIRED_BODY = JSON.stringify({ error: DEFAULT_PASSWORD_EXPIRED_ERROR, cid: "abc-123" });

describe("buildErpErrorCodeHeaders", () => {
  it("forwards the expired-password code as a header", () => {
    expect(buildErpErrorCodeHeaders(EXPIRED_BODY)).toEqual({
      [ERP_ERROR_CODE_HEADER]: DEFAULT_PASSWORD_EXPIRED_ERROR,
    });
  });

  it.each([
    ["undefined body", undefined],
    ["empty body", ""],
    ["another ERP error", JSON.stringify({ error: "Invalid or missing token" })],
    ["non-JSON body", "<html>Unauthorized</html>"],
    ["HTML body naming the code", `<html>${DEFAULT_PASSWORD_EXPIRED_ERROR}</html>`],
  ])("emits no header for %s", (_case, body) => {
    expect(buildErpErrorCodeHeaders(body)).toEqual({});
  });

  it("does not emit the header when the code only appears in another field", () => {
    const body = JSON.stringify({ error: "Something else", details: DEFAULT_PASSWORD_EXPIRED_ERROR });

    expect(buildErpErrorCodeHeaders(body)).toEqual({});
  });
});
