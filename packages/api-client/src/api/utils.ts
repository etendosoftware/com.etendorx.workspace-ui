import { DEFAULT_LOGIN_CHARSET } from "./constants";
import type { LoginResponse } from "./types";

const getCharset = (result: Response) => {
  const contentType = result.headers.get("content-type");
  if (contentType?.includes("charset=")) {
    return contentType.split("charset=")[1].split(";")[0].trim();
  }
  // Default to utf-8 for JSON responses, fall back to DEFAULT_LOGIN_CHARSET for others
  if (contentType?.includes("application/json")) {
    return "utf-8";
  }
  return DEFAULT_LOGIN_CHARSET;
};

export const getDecodedJsonResponse = async (result: Response): Promise<LoginResponse> => {
  const charset = getCharset(result);
  const buffer = await result.arrayBuffer();
  
  try {
    const decoder = new TextDecoder(charset);
    const decodedText = decoder.decode(buffer);
    return JSON.parse(decodedText);
  } catch (error) {
    // If TextDecoder fails, try with utf-8 as fallback
    if (charset !== "utf-8") {
      console.warn(`Failed to decode with charset ${charset}, falling back to utf-8`);
      const decoder = new TextDecoder("utf-8");
      const decodedText = decoder.decode(buffer);
      return JSON.parse(decodedText);
    }
    throw error;
  }
};
