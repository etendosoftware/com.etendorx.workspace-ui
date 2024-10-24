const getDefaultCacheDuration = () => {
  try {
    const value = parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION || '300000');
    return Math.abs(value);
  } catch (e) {
    console.warn(e);
    return 5 * 60 * 1000;
  }
};

export const TOKEN = process.env.NEXT_PUBLIC_TOKEN;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const API_SANITY_CHECK_URL = `${API_BASE_URL}/security/Login`;
export const API_LOGIN_URL = `${API_BASE_URL}/sws/login`;
export const API_DATASOURCE_URL = `${API_BASE_URL}/sws/com.smf.securewebservices.datasource/org.openbravo.service.datasource`;
export const API_OBREST_URL = `${API_BASE_URL}/sws/com.smf.securewebservices.obRest`;
export const API_METADATA_URL = `${API_BASE_URL}/meta`;
export const API_METADATA_JSON_URL = `${API_BASE_URL}/com.etendo.metadata`;
export const API_DEFAULT_CACHE_DURATION = getDefaultCacheDuration();
export const AUTH_HEADER_NAME = process.env.NEXT_PUBLIC_AUTH_HEADER_NAME as string;
export const API_SET_DEFAULT_CONFIGURATION_URL = `${API_BASE_URL}/sws/com.smf.securewebservices.kernel/org.openbravo.client.kernel`;

export enum HTTP_CODES {
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}
export const MAX_ATTEMPTS = 20;
