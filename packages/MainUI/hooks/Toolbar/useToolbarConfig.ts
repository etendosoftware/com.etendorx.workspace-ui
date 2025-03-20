import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUTTON_IDS } from '../../constants/Toolbar';
import { useSearch } from '../../contexts/searchContext';
import { useMetadataContext } from '../useMetadataContext';

export const useToolbarConfig = ({
  windowId,
  tabId,
  onSave,
  parentId,
}: {
  windowId?: string;
  tabId?: string;
  onSave?: () => void;
  parentId?: string;
}) => {
  const router = useRouter();
  const { setSearchQuery } = useSearch();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { setShowTabContainer } = useMetadataContext();

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case BUTTON_IDS.NEW:
          router.push(`/window/${windowId}/${tabId}/NewRecord?parentId=${parentId ?? null}`);
          break;
        case BUTTON_IDS.FIND:
          setSearchOpen(true);
          break;
        case BUTTON_IDS.TAB_CONTROL:
          setShowTabContainer(prevState => !prevState);
          break;
        case BUTTON_IDS.SAVE:
          onSave?.();
          break;
      }
    },
    [onSave, parentId, router, setShowTabContainer, tabId, windowId],
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchValue(query);
      setSearchQuery(query);
    },
    [setSearchQuery],
  );

  return useMemo(
    () => ({
      handleAction,
      searchOpen,
      setSearchOpen,
      handleSearch,
      searchValue,
      setSearchValue,
      setShowTabContainer,
    }),
    [handleAction, handleSearch, searchOpen, searchValue, setShowTabContainer],
  );
};
