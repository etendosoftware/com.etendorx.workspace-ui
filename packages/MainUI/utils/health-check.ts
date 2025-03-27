import { API_METADATA_URL } from '@workspaceui/etendohookbinder/src/api/constants';
import { delay } from '@/utils';
import { logger } from '@/utils/logger';

export async function performHealthCheck(
  url: string,
  signal: AbortSignal,
  maxAttempts: number,
  delayMs: number,
  onSuccess: () => void,
  onError: () => void,
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url + API_METADATA_URL, {
        method: 'OPTIONS',
        signal,
        keepalive: false,
      });

      if (response.ok && !signal.aborted) {
        onSuccess();

        break;
      } else {
        throw new Error(response.statusText);
      }
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
