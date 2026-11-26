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

import type { EnhancedRetryResult } from "./sessionRetryWithCsrf";

const HTTP_UNAUTHORIZED = 401;
const HTTP_INTERNAL_SERVER_ERROR = 500;

/**
 * Status to answer a request whose ERP session could not be used with. An invalid, expired or
 * revoked token keeps its 401 so the client closes the session; any other failure is a server error.
 *
 * @param result the failed retry result
 * @returns 401 or 500
 */
export function getFailureStatus(result: Pick<EnhancedRetryResult<unknown>, "status">): number {
  return result.status === HTTP_UNAUTHORIZED ? HTTP_UNAUTHORIZED : HTTP_INTERNAL_SERVER_ERROR;
}
