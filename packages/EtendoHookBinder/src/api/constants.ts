export const API_LOGIN_URL = `/sws/login`;
export const DEFAULT_LOGIN_CHARSET = 'ISO-8859-1';
export const API_METADATA_URL = `/meta/`;
export const API_KERNEL_SERVLET = `/meta/org.openbravo.client.kernel`;
export const API_DATASOURCE_SERVLET = `/meta/org.openbravo.service.datasource/`;

export const API_DEFAULT_CACHE_DURATION = (() => {
  if (process.env.NEXT_PUBLIC_CACHE_DURATION) {
    return Math.abs(parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION));
  } else {
    return 3600000;
  }
})();

export const AUTH_HEADER_NAME = (() => {
  if (process.env.NEXT_PUBLIC_AUTH_HEADER_NAME) {
    return process.env.NEXT_PUBLIC_AUTH_HEADER_NAME;
  } else {
    return 'Authorization';
  }
})();

export enum HTTP_CODES {
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}
