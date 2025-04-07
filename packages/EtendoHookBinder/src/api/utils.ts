import { DEFAULT_LOGIN_CHARSET } from './constants';

const getCharset = (result: Response) =>
  result.headers.get('content-type')?.split('charset=')?.pop() || DEFAULT_LOGIN_CHARSET;

export const getDecodedJsonResponse = async <T>(result: Response): Promise<T> => {
  const charset = getCharset(result);
  const buffer = await result.arrayBuffer();
  const decoder = new TextDecoder(charset);
  const decodedText = decoder.decode(buffer);

  return JSON.parse(decodedText);
};
