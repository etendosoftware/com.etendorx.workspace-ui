import { API_BASE_URL } from './constants';
import { SessionResponse } from './types';

export const getSession = async (token: string): Promise<SessionResponse> => {
  const response = await fetch(`${API_BASE_URL}/meta/session?stateless=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};
