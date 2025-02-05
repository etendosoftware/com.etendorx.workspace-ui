const getDefaultCacheDuration = () => {
  if (process.env.NEXT_PUBLIC_CACHE_DURATION) {
    return Math.abs(parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION));
  } else {
    return 3600000;
  }
};

const getAuthHeaderName = () => {
  if (process.env.NEXT_PUBLIC_AUTH_HEADER_NAME) {
    return process.env.NEXT_PUBLIC_AUTH_HEADER_NAME;
  } else {
    return 'Authorization';
  }
};

const getApiBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  } else {
    return 'http://localhost:8080/etendo';
  }
};

export const TOKEN = process.env.NEXT_PUBLIC_TOKEN;
export const API_BASE_URL = getApiBaseURL();
export const API_LOGIN_URL = `${API_BASE_URL}/sws/login`;
export const DEFAULT_LOGIN_CHARSET = 'ISO-8859-1';
export const API_DATASOURCE_URL = `${API_BASE_URL}/sws/com.smf.securewebservices.datasource/org.openbravo.service.datasource/`;
export const API_OBREST_URL = `${API_BASE_URL}/sws/com.smf.securewebservices.obRest/`;
export const API_METADATA_URL = `${API_BASE_URL}/meta/`;
export const API_DEFAULT_CACHE_DURATION = getDefaultCacheDuration();
export const AUTH_HEADER_NAME = getAuthHeaderName();
export const API_KERNEL_SERVLET = `${API_BASE_URL}/meta/servlets/org.openbravo.client.kernel.KernelServlet`;

export enum HTTP_CODES {
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}
