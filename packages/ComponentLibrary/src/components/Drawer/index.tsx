import React, { useCallback, useMemo, useState } from 'react';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps } from './types';
import { Menu } from '../../../../EtendoHookBinder/src/api/types';
import DrawerHeader from './Header';
import { Box } from '..';
import TextInputAutocomplete from '../Input/TextInput/TextInputAutocomplete';

interface SearchResult {
  items: Menu[];
  expandedIds: Set<string>;
}

const searchRecursively = (
  items: Menu[],
  searchValue: string,
  parentIds: string[] = [],
): SearchResult => {
  const result: SearchResult = {
    items: [],
    expandedIds: new Set<string>(),
  };

  items.forEach(item => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchValue.toLowerCase());
    let childResult: SearchResult = {
      items: [],
      expandedIds: new Set<string>(),
    };

    if (Array.isArray(item.children) && item.children.length > 0) {
      childResult = searchRecursively(item.children, searchValue, [
        ...parentIds,
        item.id,
      ]);
    }

    if (matchesSearch || childResult.items.length > 0) {
      result.items.push({
        ...item,
        children:
          childResult.items.length > 0 ? childResult.items : item.children,
      });

      // Add all parent IDs and the current item ID to expandedIds
      parentIds.forEach(id => result.expandedIds.add(id));
      result.expandedIds.add(item.id);

      // Merge child expanded IDs
      childResult.expandedIds.forEach(id => result.expandedIds.add(id));
    }
  });

  return result;
};

const getAllTitles = (items: Menu[]): string[] => {
  return items.reduce((acc, item) => {
    acc.push(item.name);
    if (Array.isArray(item.children)) {
      acc.push(...getAllTitles(item.children));
    }
    return acc;
  }, [] as string[]);
};

const Drawer: React.FC<DrawerProps> = ({
  items = [],
  logo,
  title,
  onClick,
}) => {
  const [open, setOpen] = useState<boolean>(true);
  const [searchValue, setSearchValue] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

  const drawerStyle = useMemo(
    () => ({
      ...styles.drawerPaper,
      width: open ? '16.25rem' : '3.5rem',
      height: '100vh',
      transition: 'width 0.5s ease-in-out',
      display: 'flex',
    }),
    [open],
  );

  const { filteredItems, searchExpandedItems } = useMemo(() => {
    if (!searchValue || !Array.isArray(items))
      return { filteredItems: items, searchExpandedItems: new Set<string>() };
    const result = searchRecursively(items, searchValue);
    return {
      filteredItems: result.items,
      searchExpandedItems: result.expandedIds,
    };
  }, [items, searchValue]);

  const allItemTitles = useMemo(
    () => (Array.isArray(items) ? getAllTitles(items) : []),
    [items],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (value) {
        setExpandedItems(prev => new Set([...prev, ...searchExpandedItems]));
      } else {
        setExpandedItems(new Set());
      }
    },
    [searchExpandedItems],
  );

  const toggleItemExpansion = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const renderItems = useCallback(
    (items: Menu[]) => {
      return items.map(item => (
        <React.Fragment key={item.id}>
          <DrawerSection
            item={item}
            onClick={onClick}
            open={open}
            isExpanded={expandedItems.has(item.id)}
            onToggleExpand={() => toggleItemExpansion(item.id)}
            hasChildren={
              Array.isArray(item.children) && item.children.length > 0
            }
          />
          {Array.isArray(item.children) &&
            item.children.length > 0 &&
            expandedItems.has(item.id) && (
              <Box sx={{ marginLeft: '1rem' }}>
                {renderItems(item.children)}
              </Box>
            )}
        </React.Fragment>
      ));
    },
    [onClick, open, expandedItems, toggleItemExpansion],
  );

  return (
    <div style={drawerStyle}>
      <DrawerHeader
        logo={logo}
        title={title}
        open={open}
        onClick={handleHeaderClick}
      />
      {open && (
        <Box sx={{ padding: '0.5rem' }}>
          <TextInputAutocomplete
            value={searchValue}
            setValue={handleSearch}
            placeholder="Search"
            autoCompleteTexts={allItemTitles}
          />
        </Box>
      )}
      <Box sx={styles.drawerContent}>
        {Array.isArray(filteredItems) ? renderItems(filteredItems) : null}
      </Box>
    </div>
  );
};

export default Drawer;
