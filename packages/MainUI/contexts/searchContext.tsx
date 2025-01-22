import { createContext, useContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { createSearchIndex, filterItems } from '@workspaceui/componentlibrary/src/utils/searchUtils';
import { SearchContextType } from '@workspaceui/componentlibrary/src/components/Drawer/types';

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
  items: Menu[];
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children, items }) => {
  const [searchValue, setSearchValue] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const searchIndex = useMemo(() => createSearchIndex(items), [items]);

  const { filteredItems, searchExpandedItems } = useMemo(
    () => filterItems(items, searchValue, searchIndex),
    [items, searchValue, searchIndex],
  );

  useEffect(() => {
    if (searchValue) {
      setExpandedItems(prev => new Set([...prev, ...searchExpandedItems]));
    }
  }, [searchValue, searchExpandedItems]);

  const value = {
    searchValue,
    setSearchValue,
    filteredItems,
    expandedItems,
    setExpandedItems,
    searchExpandedItems,
    searchIndex,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};
