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

export const API_LOGIN_URL = "/meta/login";
export const DEFAULT_LOGIN_CHARSET = "ISO-8859-1";
export const API_METADATA_URL = "/meta/";
export const API_DEFAULT_CACHE_DURATION = getDefaultCacheDuration();
export const AUTH_HEADER_NAME = getAuthHeaderName();
export const API_FORWARD_PATH = `${API_METADATA_URL}forward`; //"/meta/forward";
export const API_KERNEL_SERVLET = `${API_FORWARD_PATH}/org.openbravo.client.kernel`;
export const API_DATASOURCE_SERVLET = `${API_FORWARD_PATH}/org.openbravo.service.datasource/`;

export enum HTTP_CODES {
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}
