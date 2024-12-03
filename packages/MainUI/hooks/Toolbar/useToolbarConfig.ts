import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BUTTON_IDS } from '../../constants/Toolbar';

export const useToolbarConfig = (windowId: string, tabId?: string) => {
  const router = useRouter();

  const handleAction = useCallback(
    (action: string) => {
      if (action === BUTTON_IDS.NEW) {
        router.push(`/window/${windowId}/${tabId}/NewRecord`);
      }
    },
    [router, tabId, windowId],
  );

  return { handleAction };
};
