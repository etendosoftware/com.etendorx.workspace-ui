import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUTTON_IDS } from '../../constants/Toolbar';
import { useSearch } from '../../contexts/searchContext';

export const useToolbarConfig = (windowId: string, tabId?: string) => {
  const router = useRouter();
  const { setSearchQuery } = useSearch();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case BUTTON_IDS.NEW:
          router.push(`/window/${windowId}/${tabId}/NewRecord`);
          break;
        case BUTTON_IDS.FIND:
          setSearchOpen(true);
          break;
      }
    },
    [router, tabId, windowId],
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return {
    handleAction,
    searchOpen,
    setSearchOpen,
    handleSearch,
  };
};
