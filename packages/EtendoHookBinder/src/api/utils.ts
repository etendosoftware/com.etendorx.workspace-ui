import { DEFAULT_LOGIN_CHARSET } from './constants';
import type { LoginResponse } from './types';

const getCharset = (result: Response) =>
  result.headers.get('content-type')?.split('charset=')?.pop() || DEFAULT_LOGIN_CHARSET;

export const getDecodedJsonResponse = async (result: Response): Promise<LoginResponse> => {
  const charset = getCharset(result);
  const buffer = await result.arrayBuffer();
  const decoder = new TextDecoder(charset);
  const decodedText = decoder.decode(buffer);

  return JSON.parse(decodedText);
};
