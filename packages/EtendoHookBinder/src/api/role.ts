import { API_LOGIN_URL } from './constants';
import { LoginResponse } from './types';

export const changeRole = async (roleId: string, token: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(API_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        role: roleId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: LoginResponse = await response.json();
    console.log('Change role response:', data);

    if (data.status !== 'success' || !data.token || !Array.isArray(data.roleList)) {
      throw new Error('Invalid server response');
    }

    return data;
  } catch (error) {
    console.error('Change role error:', error);
    throw error;
  }
};
