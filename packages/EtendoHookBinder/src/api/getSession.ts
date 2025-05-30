import { Metadata } from "./metadata";
import type { SessionResponse } from "./types";

export const getSession = async (): Promise<SessionResponse> => {
  const response = await Metadata.client.request("/session");

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.data;
};
