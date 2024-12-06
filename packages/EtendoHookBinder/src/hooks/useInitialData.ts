import { Metadata } from '../api/metadata';
import { API_CLIENT_KERNEL_SWS_URL } from '../api/constants';

interface FormInitializationParams {
  MODE: string;
  PARENT_ID: string;
  TAB_ID: string;
  ROW_ID: string;
  _action: string;
}

export const getFormInitialization = async (params: FormInitializationParams) => {
  try {
    const queryString = new URLSearchParams({
      ...params,
      _action: 'org.openbravo.client.application.window.FormInitializationComponent',
    }).toString();

    const response = await Metadata.kernelClient.post(`${API_CLIENT_KERNEL_SWS_URL}?${queryString}`);
    const data = await response.json();

    if (data.response?.status === -1) {
      throw new Error(data.response.error?.message || 'Unknown server error');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Form initialization error:', error);
    throw error;
  }
};
