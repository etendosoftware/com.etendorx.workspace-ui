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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

const getDefaultCacheDuration = () => {
  if (process.env.NEXT_PUBLIC_CACHE_DURATION) {
    return Math.abs(Number.parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION));
  }
  return 3600000;
};

const getAuthHeaderName = () => {
  if (process.env.NEXT_PUBLIC_AUTH_HEADER_NAME) {
    return process.env.NEXT_PUBLIC_AUTH_HEADER_NAME;
  }
  return "Authorization";
};

export const API_LOGIN_URL = "/api/auth/login";
export const DEFAULT_LOGIN_CHARSET = "ISO-8859-1";
export const API_METADATA_URL = "/meta/";
export const API_DEFAULT_CACHE_DURATION = getDefaultCacheDuration();
export const AUTH_HEADER_NAME = getAuthHeaderName();
export const API_FORWARD_PATH = `${API_METADATA_URL}forward`; //"/meta/forward";
export const API_KERNEL_SERVLET = `${API_FORWARD_PATH}/org.openbravo.client.kernel`;
export const API_DATASOURCE_SERVLET = `${API_FORWARD_PATH}/org.openbravo.service.datasource/`;

// Next.js proxy routes
export const API_ERP_PROXY = "/api/erp";
export const API_DATASOURCE_PROXY = "/api/datasource";

export enum HTTP_CODES {
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}
