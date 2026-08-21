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

import { DEFAULT_PASSWORD_EXPIRED_ERROR, ERP_ERROR_CODE_HEADER } from "../constants";
import { getErpErrorCode, isPasswordExpiredResponse } from "../erpErrorCode";

/** Builds a response-like object exposing only the headers the helpers read. */
const responseWith = (code?: string) =>
  ({
    headers: { get: (name: string) => (name === ERP_ERROR_CODE_HEADER ? (code ?? null) : null) },
  }) as unknown as Response;

describe("utils/session/erpErrorCode", () => {
  it("reads the error code from the header", () => {
    expect(getErpErrorCode(responseWith(DEFAULT_PASSWORD_EXPIRED_ERROR))).toBe(DEFAULT_PASSWORD_EXPIRED_ERROR);
  });

  it("returns null when the header is absent", () => {
    expect(getErpErrorCode(responseWith())).toBeNull();
  });

  it("returns null when the response exposes no headers", () => {
    expect(getErpErrorCode({} as unknown as Response)).toBeNull();
  });

  it("detects the expired-password rejection", () => {
    expect(isPasswordExpiredResponse(responseWith(DEFAULT_PASSWORD_EXPIRED_ERROR))).toBe(true);
  });

  it.each([undefined, "InvalidCSRFToken"])("ignores other responses (code %p)", (code) => {
    expect(isPasswordExpiredResponse(responseWith(code))).toBe(false);
  });
});
