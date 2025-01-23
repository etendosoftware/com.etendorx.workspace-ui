'use client';

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useStyle } from './styles';
import { DrawerProps } from './types';
import DrawerHeader from './Header';
import TextInputAutocomplete from '../Input/TextInput/TextInputAutocomplete';
import { getAllItemTitles } from '../../utils/searchUtils';
import DrawerItems from './Search';
import { Box } from '@mui/material';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { findItemByIdentifier } from '../../utils/menuUtils';

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
  const [open, setOpen] = useState<boolean>(true);
  const { sx } = useStyle();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { searchValue, setSearchValue, filteredItems, expandedItems, setExpandedItems, searchIndex } = searchContext;

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

  const [recentlyViewedRef, setRecentlyViewedRef] = useState<{
    handleWindowAccess?: (item: Menu) => void;
  }>({});

  const handleItemClick = useCallback(
    (path: string) => {
      const clickedId = path.split('/').pop();
      if (clickedId) {
        const menuItem = findItemByIdentifier(items, clickedId);

        if (menuItem && recentlyViewedRef.handleWindowAccess) {
          const syntheticEvent = {
            id: menuItem.id,
            name: getTranslatedName ? getTranslatedName(menuItem) : menuItem._identifier || menuItem.name || '',
            windowId: menuItem.windowId,
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
