'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useStyle } from './styles';
import { DrawerProps } from './types';
import DrawerHeader from './Header';
import TextInputAutocomplete from '../Input/TextInput/TextInputAutocomplete';
import { createSearchIndex, filterItems, getAllItemTitles } from '../../utils/searchUtils';
import DrawerItems from './Search';
import { Box } from '@mui/material';
import { findItemByWindowId } from '../../utils/menuUtils';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';

const Drawer: React.FC<DrawerProps> = ({
  windowId,
  items = [],
  logo,
  title,
  onClick,
  onReportClick,
  onProcessClick,
  RecentlyViewedComponent,
  getTranslatedName,
}) => {
  const [open, setOpen] = useState<boolean>(true);
  const [searchValue, setSearchValue] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { sx } = useStyle();

  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const drawerStyle = useMemo(
    () => ({
      ...sx.drawerPaper,
      width: open ? '16.25rem' : '3.5rem',
      height: '100vh',
      transition: 'width 0.5s ease-in-out',
      display: 'flex',
    }),
    [open, sx.drawerPaper],
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

  const [recentlyViewedRef, setRecentlyViewedRef] = useState<{
    handleWindowAccess?: (item: Menu) => void;
  }>({});

  const handleItemClick = useCallback(
    (path: string) => {
      const clickedWindowId = path.split('/').pop();
      if (clickedWindowId) {
        const menuItem = findItemByWindowId(items, clickedWindowId);
        if (menuItem && recentlyViewedRef.handleWindowAccess) {
          const syntheticEvent = {
            id: menuItem.id,
            name: getTranslatedName ? getTranslatedName(menuItem) : menuItem._identifier || menuItem.name || '',
            windowId: menuItem.windowId!,
            type: menuItem.type || 'Window',
          };
          recentlyViewedRef.handleWindowAccess(syntheticEvent);
        }
      }
      onClick(path);
    },
    [onClick, items, getTranslatedName, recentlyViewedRef],
  );

  return (
    <Box sx={drawerStyle}>
      <DrawerHeader logo={logo} title={title} open={open} onClick={handleHeaderClick} tabIndex={-1} />
      {RecentlyViewedComponent && (
        <RecentlyViewedComponent
          onClick={handleItemClick}
          open={open}
          items={items}
          windowId={windowId}
          getTranslatedName={getTranslatedName}
          ref={setRecentlyViewedRef}
        />
      )}
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
      <Box sx={sx.drawerContent} tabIndex={2}>
        {Array.isArray(searchValue ? filteredItems : items) ? (
          <DrawerItems
            items={filteredItems}
            onClick={handleItemClick}
            onReportClick={onReportClick}
            onProcessClick={onProcessClick}
            open={open}
            expandedItems={expandedItems}
            toggleItemExpansion={toggleItemExpansion}
            searchValue={searchValue}
            windowId={windowId}
          />
        ) : null}
      </Box>
    </Box>
  );
};
export default Drawer;
