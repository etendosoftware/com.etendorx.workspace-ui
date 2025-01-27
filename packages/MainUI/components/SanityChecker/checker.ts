import { API_METADATA_URL } from '@workspaceui/etendohookbinder/src/api/constants';
import { delay } from '@/utils';

export async function performHealthCheck(
  signal: AbortSignal,
  maxAttempts: number,
  delayMs: number,
  onSuccess: () => void,
  onError: () => void,
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(API_METADATA_URL, {
        method: 'OPTIONS',
        signal,
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      if (signal.aborted) return;

      console.warn(`Health check attempt ${attempt} failed:`, error);

      if (attempt === maxAttempts) {
        onError();
      }

      await delay(delayMs);
    }
  }
}
