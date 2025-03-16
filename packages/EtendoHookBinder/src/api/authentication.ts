import { API_LOGIN_URL } from './constants';
import { Metadata } from './metadata';
import { LoginResponse } from './types';
import { getJson } from './utils';

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const result = await Metadata.client.request(API_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}`);
    }

    const data = await getJson(result);

    if (data.status === 'error') {
      throw new Error(data.status);
    } else if (data.status !== 'success' || !data.token || !Array.isArray(data.roleList)) {
      throw new Error('Invalid server response');
    } else return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
