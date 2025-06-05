import { delay } from "@/utils";
import { logger } from "@/utils/logger";
import { API_LOGIN_URL } from "@workspaceui/etendohookbinder/src/api/constants";

export async function performHealthCheck(
  url: string,
  signal: AbortSignal,
  maxAttempts: number,
  delayMs: number,
  onSuccess: () => void,
  onError: () => void
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url + API_LOGIN_URL, {
        method: "OPTIONS",
        signal,
        keepalive: false,
        credentials: "include",
      });

      if (response.ok && !signal.aborted) {
        onSuccess();

        break;
      }
      throw new Error(response.statusText);
    } catch (error) {
      if (signal.aborted) return;

      logger.warn(`Health check attempt ${attempt} failed:`, error);

      if (attempt === maxAttempts && !signal.aborted) {
        onError();
      }

      await delay(delayMs);
    }
  }
}
