export const TOKEN = import.meta.env['VITE_API_TOKEN'];
export const API_BASE_URL = import.meta.env['VITE_API_BASE_URL'];
export const API_DATASOURCE_URL = `${API_BASE_URL}/org.openbravo.service.datasource`;
export const API_METADATA_URL = `${API_BASE_URL}/org.openbravo.client.kernel/OBUIAPP_MainLayout`;
export const API_DEFAULT_CACHE_DURATION = parseInt(import.meta.env['VITE_API_BASE_URL']);
export const entities = [
  'Order',
  'Invoice',
  'Product',
  'OrderLine',
];
