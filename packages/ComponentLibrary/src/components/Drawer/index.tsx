import React, { useCallback, useMemo, useState } from 'react';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps } from './types';
import { Menu } from '../../../../EtendoHookBinder/src/api/types';
import DrawerHeader from './Header';
import { Box } from '..';
import TextInputAutocomplete from '../Input/TextInput/TextInputAutocomplete';
import {
  createSearchIndex,
  filterItems,
  getAllItemTitles,
} from '../../utils/searchUtils';

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

  const searchIndex = useMemo(() => createSearchIndex(items), [items]);

  const { filteredItems, searchExpandedItems } = useMemo(
    () => filterItems(items, searchValue, searchIndex),
    [items, searchValue, searchIndex],
  );

  const allItemTitles = useMemo(
    () => getAllItemTitles(searchIndex),
    [searchIndex],
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
      return items.map(item => {
        const isExpanded = expandedItems.has(item.id) || Boolean(searchValue);
        return (
          <React.Fragment key={item.id}>
            <DrawerSection
              item={item}
              onClick={onClick}
              open={open}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleItemExpansion(item.id)}
              hasChildren={
                Array.isArray(item.children) && item.children.length > 0
              }
              isExpandable={
                !searchValue &&
                Array.isArray(item.children) &&
                item.children.length > 0
              }
              isSearchActive={Boolean(searchValue)}>
              {isExpanded &&
                Array.isArray(item.children) &&
                item.children.length > 0 && (
                  <Box sx={{ marginLeft: '1rem' }}>
                    {renderItems(item.children)}
                  </Box>
                )}
            </DrawerSection>
          </React.Fragment>
        );
      });
    },
    [onClick, open, expandedItems, toggleItemExpansion, searchValue],
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
