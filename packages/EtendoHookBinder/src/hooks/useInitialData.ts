import { API_FORM_INITIALIZATION_URL } from '../api/constants';
import { BasicAuthHelper } from '../auth/basicAuth';

interface FormInitializationParams {
  MODE: string;
  PARENT_ID: string;
  TAB_ID: string;
  ROW_ID: string;
  _action: string;
}

export const getFormInitialization = async (params: FormInitializationParams) => {
  const queryString = new URLSearchParams({
    ...params,
    _action: 'org.openbravo.client.application.window.FormInitializationComponent',
  }).toString();

  const response = await fetch(`${API_FORM_INITIALIZATION_URL}?${queryString}`, {
    method: 'POST',
    credentials: 'include',
    headers: BasicAuthHelper.createHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
