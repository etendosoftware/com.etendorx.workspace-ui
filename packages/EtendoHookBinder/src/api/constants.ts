export const TOKEN = import.meta.env['VITE_API_TOKEN'];
export const API_BASE_URL = import.meta.env['VITE_API_BASE_URL'];
export const API_LOGIN_URL = `${API_BASE_URL}/sws/login`;
export const API_DATASOURCE_URL = `${API_BASE_URL}/sws/com.smf.securewebservices.datasource/org.openbravo.service.datasource`;
export const API_OBREST_URL = `${API_BASE_URL}/sws/com.smf.securewebservices.obRest`;
export const API_METADATA_URL = `${API_BASE_URL}/meta`;
export const API_METADATA_JSON_URL = `${API_BASE_URL}/com.etendo.metadata`;
export const API_DEFAULT_CACHE_DURATION = parseInt(
  import.meta.env['VITE_CACHE_DURATION'],
);
export const AUTH_HEADER_NAME = import.meta.env[
  'VITE_AUTH_HEADER_NAME'
] as string;
