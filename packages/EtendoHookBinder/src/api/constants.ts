export const API_BASE_URL = import.meta.env['VITE_API_BASE_URL'];
export const API_METADATA_URL = `${API_BASE_URL}/etendo/org.openbravo.client.kernel/OBUIAPP_MainLayout`;
export const entities: Etendo.Entity[] = ["Order", "Invoice", "Product", "OrderLine"];
