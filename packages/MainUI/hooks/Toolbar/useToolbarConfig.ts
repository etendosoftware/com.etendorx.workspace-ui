import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUTTON_IDS } from '../../constants/Toolbar';
import { useSearch } from '../../contexts/searchContext';

export const useToolbarConfig = ({
  windowId,
  tabId,
  onSave,
}: {
  windowId?: string;
  tabId?: string;
  onSave?: () => void;
}) => {
  const router = useRouter();
  const { setSearchQuery } = useSearch();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case BUTTON_IDS.NEW:
          router.push(`/window/${windowId}/${tabId}/NewRecord`);
          break;
        case BUTTON_IDS.FIND:
          setSearchOpen(true);
          break;
        case BUTTON_IDS.SAVE:
          onSave?.();
          break;
      }
    },
    [onSave, router, tabId, windowId],
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
