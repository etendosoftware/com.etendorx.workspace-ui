import { Metadata } from './metadata';
import { SessionResponse } from './types';

export const getSession = async (token: string): Promise<SessionResponse> => {
  const response = await Metadata.client.request(`/session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.data;
};
