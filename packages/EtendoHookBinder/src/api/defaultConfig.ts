import { API_SET_DEFAULT_CONFIGURATION_URL } from './constants';
import { DefaultConfiguration } from './types';

export const setDefaultConfiguration = async (token: string, config: DefaultConfiguration): Promise<void> => {
  const response = await fetch(API_SET_DEFAULT_CONFIGURATION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language: config.language || '192',
      role: config.defaultRole,
      client: config.client || 'System',
      organization: config.organization,
      warehouse: config.defaultWarehouse,
      default: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Default configuration updated:', data);
};
