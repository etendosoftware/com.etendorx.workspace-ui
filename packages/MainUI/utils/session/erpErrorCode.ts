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

import { DEFAULT_PASSWORD_EXPIRED_ERROR, ERP_ERROR_CODE_HEADER } from "./constants";

/**
 * Reads the stable error code the ERP proxy forwards as a header. Reading headers never consumes the
 * body, which matters because response interceptors run before the body is parsed.
 *
 * @param response the response to inspect
 * @returns the reported error code, or null when the response carries none
 */
export function getErpErrorCode(response: Pick<Response, "headers">): string | null {
  return response.headers?.get?.(ERP_ERROR_CODE_HEADER) ?? null;
}

/**
 * Tells whether a response was rejected because the user must change an expired password.
 *
 * @param response the response to inspect
 * @returns true when the backend reported the expired-password rejection
 */
export function isPasswordExpiredResponse(response: Pick<Response, "headers">): boolean {
  return getErpErrorCode(response) === DEFAULT_PASSWORD_EXPIRED_ERROR;
}
