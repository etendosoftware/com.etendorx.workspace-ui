import { Client } from './client';
import { API_SET_DEFAULT_CONFIGURATION_URL } from './constants';
import { DefaultConfiguration } from './types';

const DEFAULT_CONFIG = {
  language: '192',
  role: '0',
  client: 'System',
  organization: '0',
  warehouse: '0',
  default: 'true',
};

export const setDefaultConfiguration = async (token: string, config: DefaultConfiguration): Promise<void> => {
  const client = new Client(API_SET_DEFAULT_CONFIGURATION_URL).setAuthHeader(token, 'Bearer');

  const params = {
    language: (config.language || DEFAULT_CONFIG.language).toString(),
    role: (config.defaultRole || DEFAULT_CONFIG.role).toString(),
    client: (config.client || DEFAULT_CONFIG.client).toString(),
    organization: (config.organization || DEFAULT_CONFIG.organization).toString(),
    warehouse: (config.defaultWarehouse || DEFAULT_CONFIG.warehouse).toString(),
    default: DEFAULT_CONFIG.default,
  };

  try {
    const response = await client.post(
      '?command=save&_action=org.openbravo.client.application.navigationbarcomponents.UserInfoWidgetActionHandler',
      params,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (typeof response.data === 'string' && response.data.includes('throw')) {
      throw new Error('Server returned an error in JavaScript');
    }

    console.log('Default configuration updated:', response.data);
  } catch (error) {
    console.error('Error setting default configuration:', error);
    throw error;
  }
};
