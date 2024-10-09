import { API_BASE_URL } from './constants';

export interface SessionResponse {
  user: {
    id: string;
    name: string;
    username: string;
    defaultRole: string;
  };
  role: {
    id: string;
    name: string;
  };
}

export const getSession = async (token: string): Promise<SessionResponse> => {
  const response = await fetch(`${API_BASE_URL}/meta/session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};
