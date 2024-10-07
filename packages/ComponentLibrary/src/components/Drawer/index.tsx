import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { styles } from './styles';
import { DrawerProps } from './types';
import DrawerHeader from './Header';
import { Box } from '..';
import TextInputAutocomplete from '../Input/TextInput/TextInputAutocomplete';
import { createSearchIndex, filterItems, getAllItemTitles } from '../../utils/searchUtils';
import DrawerItems from './Search';

const Drawer: React.FC<DrawerProps> = ({ items = [], logo, title, onClick }) => {
  const [open, setOpen] = useState<boolean>(true);
  const [searchValue, setSearchValue] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

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

  return (
    <div style={drawerStyle}>
      <DrawerHeader logo={logo} title={title} open={open} onClick={handleHeaderClick} tabIndex={-1} />
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
            onClick={onClick}
            open={open}
            expandedItems={expandedItems}
            toggleItemExpansion={toggleItemExpansion}
            searchValue={searchValue}
          />
        ) : null}
      </Box>
    </div>
  );
};

export default Drawer;
