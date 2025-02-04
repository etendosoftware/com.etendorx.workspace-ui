import { Metadata } from '../api/metadata';

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
      stateless: 'true',
      _action: 'org.openbravo.client.application.window.FormInitializationComponent',
    }).toString();

    const { data } = await Metadata.kernelClient.post(`?${queryString}`, {});

    return data;
  } catch (error) {
    console.error('Form initialization error:', error);
    throw error;
  }
};
