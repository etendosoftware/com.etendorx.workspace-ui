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

import { DEFAULT_PASSWORD_EXPIRED_ERROR, ERP_ERROR_CODE_HEADER } from "@/utils/session/constants";

/**
 * Builds a response-like object with the status and the ERP error code header the session rule reads.
 *
 * @param status the HTTP status
 * @param passwordExpired whether the ERP reported the expired-password rejection
 */
export const sessionResponse = (status: number, passwordExpired = false) =>
  ({
    status,
    headers: {
      get: (name: string) => (passwordExpired && name === ERP_ERROR_CODE_HEADER ? DEFAULT_PASSWORD_EXPIRED_ERROR : null),
    },
  }) as unknown as Response;
