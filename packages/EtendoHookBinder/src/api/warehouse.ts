import { API_LOGIN_URL } from './constants';
import { Metadata } from './metadata';
import { LoginResponse } from './types';
import { getDecodedJsonResponse } from './utils';

export const changeWarehouse = async (warehouseId: string, token: string): Promise<LoginResponse> => {
  try {
    const response = await Metadata.client.request(API_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        warehouse: warehouseId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: LoginResponse = await getDecodedJsonResponse(response);

    if (data.status !== 'success' || !data.token || !Array.isArray(data.roleList)) {
      throw new Error('Invalid server response');
    }

    return data;
  } catch (error) {
    console.error('Change warehouse error:', error);
    throw error;
  }
};
