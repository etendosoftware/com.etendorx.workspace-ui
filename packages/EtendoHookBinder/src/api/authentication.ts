import { API_LOGIN_URL } from './constants';
import { Metadata } from './metadata';
import { LoginResponse } from './types';

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const result = await Metadata.loginClient.request<LoginResponse>(API_LOGIN_URL, {
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

  const data = result.data;

  if (data.status === 'error') {
    throw new Error(data.message);
  } else if (data.status !== 'success' || !data.token || !Array.isArray(data.roleList)) {
    throw new Error('Invalid server response');
  } else return data;
};
