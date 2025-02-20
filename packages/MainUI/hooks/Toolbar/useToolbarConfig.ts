import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUTTON_IDS } from '../../constants/Toolbar';
import { useSearch } from '../../contexts/searchContext';

export const useToolbarConfig = (windowId: string, tabId?: string, onSave?: () => Promise<void>) => {
  const router = useRouter();
  const { setSearchQuery } = useSearch();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleAction = useCallback(
    async (action: string) => {
      switch (action) {
        case BUTTON_IDS.NEW:
          router.push(`/window/${windowId}/${tabId}/NewRecord`);
          break;
        case BUTTON_IDS.FIND:
          setSearchOpen(true);
          break;
        case BUTTON_IDS.SAVE:
          console.log('click');
          if (onSave) {
            try {
              await onSave();
            } catch (error) {
              console.error('Error saving form:', error);
            }
          }
          break;
      }
    },
    [router, tabId, windowId, onSave],
  );

  const handleSearch = (query: string) => {
    setSearchValue(query);
    setSearchQuery(query);
  };

  return {
    handleAction,
    searchOpen,
    setSearchOpen,
    handleSearch,
    searchValue,
    setSearchValue,
  };
};
