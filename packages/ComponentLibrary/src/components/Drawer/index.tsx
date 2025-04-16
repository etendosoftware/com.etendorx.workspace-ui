'use client';

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useStyle } from './styles';
import { DrawerProps } from './types';
import DrawerHeader from './Header';
import TextInputAutocomplete from '../Input/TextInput/TextInputAutocomplete';
import { getAllItemTitles } from '../../utils/searchUtils';
import DrawerItems from './Search';
import { Box } from '@mui/material';

const DRAWER_STATE_KEY = 'etendo-drawer-open';

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
  searchContext,
}) => {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(DRAWER_STATE_KEY);
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });

  const { sx } = useStyle();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { searchValue, setSearchValue, filteredItems, expandedItems, setExpandedItems, searchIndex } = searchContext;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(open));
    }
  }, [open]);

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

  const allItemTitles = useMemo(() => (searchIndex ? getAllItemTitles(searchIndex) : []), [searchIndex]);

  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

  const toggleItemExpansion = useCallback(
    (itemId: string) => {
      setExpandedItems((prev: Set<string>) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    },
    [setExpandedItems],
  );

  const handleItemClick = useCallback((path: string) => {
    onClick(path);
  }, [onClick, searchContext]);

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
        />
      )}
      {open && (
        <Box sx={{ padding: '0.5rem' }}>
          <TextInputAutocomplete
            value={searchValue}
            setValue={setSearchValue}
            placeholder="Search"
            autoCompleteTexts={allItemTitles}
            inputRef={searchInputRef}
          />
        </Box>
      )}
      <Box sx={sx.drawerContent} tabIndex={2}>
        <DrawerItems
          items={searchValue ? filteredItems : items}
          onClick={handleItemClick}
          onReportClick={onReportClick}
          onProcessClick={onProcessClick}
          open={open}
          expandedItems={expandedItems}
          toggleItemExpansion={toggleItemExpansion}
          searchValue={searchValue}
          windowId={windowId}
        />
      </Box>
    </Box>
  );
};

export default Drawer;
