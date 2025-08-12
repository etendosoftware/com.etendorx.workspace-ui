/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
