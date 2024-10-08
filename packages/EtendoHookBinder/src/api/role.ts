import { API_LOGIN_URL } from './constants';

export const changeRole = async (roleId: string) => {
  const result = await fetch(API_LOGIN_URL, {
    method: 'POST',
    body: JSON.stringify({
      role: roleId,
    }),
  });
  const data = await result.json();

  if (data.status === 'error') {
    throw new Error(data.message);
  } else {
    return data.token;
  }
};
