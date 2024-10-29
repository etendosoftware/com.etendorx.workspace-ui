'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import styles from './styles';
import { DrawerProps } from './types';
import DrawerHeader from './Header';
import TextInputAutocomplete from '../Input/TextInput/TextInputAutocomplete';
import { createSearchIndex, filterItems, getAllItemTitles } from '../../utils/searchUtils';
import DrawerItems from './Search';
import RecentlyViewed from './RecentlyViewed';
import { Menu } from '@workspaceui/etendohookbinder/api/types';
import { Box } from '@mui/material';

const Drawer: React.FC<DrawerProps> = ({ windowId, items = [], logo, title, onClick }) => {
  const [open, setOpen] = useState<boolean>(true);
  const [searchValue, setSearchValue] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [recentItems, setRecentItems] = useState<Array<{ id: string; name: string; windowId: string }>>([]);

  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const storedItems = localStorage.getItem('recentlyViewedItems');
    if (storedItems) {
      setRecentItems(JSON.parse(storedItems));
    }
  }, []);

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

  const searchIndex = useMemo(() => createSearchIndex(items), [items]);

  const { filteredItems, searchExpandedItems } = useMemo(
    () => filterItems(items, searchValue, searchIndex),
    [items, searchValue, searchIndex],
  );

  const allItemTitles = useMemo(() => getAllItemTitles(searchIndex), [searchIndex]);

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

  const findItemByWindowId = useCallback((items: Menu[], windowId: string): Menu | null => {
    for (const item of items) {
      if (item.windowId === windowId) {
        return item;
      }
      if (item.children) {
        const found = findItemByWindowId(item.children, windowId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const handleItemClick = useCallback(
    (path: string) => {
      const windowId = path.split('/').pop();
      if (windowId) {
        const item = findItemByWindowId(items, windowId);
        if (item) {
          const recentItem = { id: item.id, name: item.name, windowId: item.windowId! };
          setRecentItems(prev => {
            const newItems = [recentItem, ...prev.filter(i => i.id !== recentItem.id)].slice(0, 5);
            localStorage.setItem('recentlyViewedItems', JSON.stringify(newItems));
            return newItems;
          });
        }
      }
      onClick(path);
    },
    [items, onClick, findItemByWindowId],
  );

  const handleWindowAccess = useCallback((item: { id: string; name: string; windowId: string }) => {
    setRecentItems(prev => {
      const newItems = [item, ...prev.filter(i => i.id !== item.id)].slice(0, 5);
      localStorage.setItem('recentlyViewedItems', JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  return (
    <div style={drawerStyle}>
      <DrawerHeader logo={logo} title={title} open={open} onClick={handleHeaderClick} tabIndex={-1} />
      <RecentlyViewed
        onClick={handleItemClick}
        open={open}
        onWindowAccess={handleWindowAccess}
        recentItems={recentItems}
      />
      {open && (
        <Box sx={{ padding: '0.5rem' }}>
          <TextInputAutocomplete
            value={searchValue}
            setValue={handleSearch}
            placeholder="Search"
            autoCompleteTexts={allItemTitles}
            inputRef={searchInputRef}
          />
        </Box>
      )}
      <Box sx={styles.drawerContent} tabIndex={2}>
        {Array.isArray(filteredItems) ? (
          <DrawerItems
            items={filteredItems}
            onClick={handleItemClick}
            open={open}
            expandedItems={expandedItems}
            toggleItemExpansion={toggleItemExpansion}
            searchValue={searchValue}
            windowId={windowId}
          />
        ) : null}
      </Box>
    </div>
  );
};

export default Drawer;
