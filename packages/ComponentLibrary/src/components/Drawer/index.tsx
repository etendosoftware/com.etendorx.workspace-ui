import React, { useCallback, useMemo, useState } from 'react';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps } from './types';
import { Menu } from '../../../../EtendoHookBinder/src/api/types';
import DrawerHeader from './Header';
import { Box } from '..';
import TextInputAutocomplete from '../Input/TextInput/TextInputAutocomplete';

interface IndexedMenu extends Menu {
  path: string[];
  fullPath: string;
}

interface SearchIndex {
  byId: Map<string, IndexedMenu>;
  byPhrase: Map<string, Set<string>>;
}

const createSearchIndex = (items: Menu[]): SearchIndex => {
  const index: SearchIndex = {
    byId: new Map(),
    byPhrase: new Map(),
  };

  const addToPhraseIndex = (phrase: string, id: string) => {
    if (!index.byPhrase.has(phrase)) {
      index.byPhrase.set(phrase, new Set());
    }
    index.byPhrase.get(phrase)!.add(id);
  };

  const traverse = (
    items: Menu[],
    path: string[] = [],
    fullPath: string = '',
  ) => {
    items.forEach(item => {
      const newFullPath = fullPath ? `${fullPath} > ${item.name}` : item.name;
      const indexedItem: IndexedMenu = { ...item, path, fullPath: newFullPath };
      index.byId.set(item.id, indexedItem);

      const lowerName = item.name.toLowerCase();
      addToPhraseIndex(lowerName, item.id);

      const words = lowerName.split(/\s+/);
      words.forEach(word => addToPhraseIndex(word, item.id));

      addToPhraseIndex(newFullPath.toLowerCase(), item.id);

      if (Array.isArray(item.children)) {
        traverse(item.children, [...path, item.id], newFullPath);
      }
    });
  };

  traverse(items);
  return index;
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

  const searchIndex = useMemo(() => createSearchIndex(items), [items]);

  const { filteredItems, searchExpandedItems } = useMemo(() => {
    if (!searchValue || !Array.isArray(items))
      return { filteredItems: items, searchExpandedItems: new Set<string>() };

    console.log(filteredItems);

    const lowerSearchValue = searchValue.toLowerCase();
    const searchWords = lowerSearchValue.split(/\s+/);
    const matchingIds = new Set<string>();
    const expandedIds = new Set<string>();

    searchIndex.byPhrase.forEach((ids, phrase) => {
      if (phrase.includes(lowerSearchValue)) {
        ids.forEach(id => {
          const item = searchIndex.byId.get(id)!;
          if (item.name.toLowerCase().includes(lowerSearchValue)) {
            matchingIds.add(id);
            item.path.forEach(pathId => expandedIds.add(pathId));
          }
        });
      }
    });

    if (matchingIds.size === 0) {
      const allMatchingIds = new Set<string>();
      searchWords.forEach(word => {
        searchIndex.byPhrase.forEach((ids, phrase) => {
          if (phrase.includes(word)) {
            ids.forEach(id => allMatchingIds.add(id));
          }
        });
      });

      allMatchingIds.forEach(id => {
        const item = searchIndex.byId.get(id)!;
        if (searchWords.every(word => item.name.toLowerCase().includes(word))) {
          matchingIds.add(id);
          item.path.forEach(pathId => expandedIds.add(pathId));
        }
      });
    }

    const rebuildTree = (originalItems: Menu[]): Menu[] => {
      return originalItems.reduce((acc, item) => {
        if (matchingIds.has(item.id)) {
          acc.push({ ...item, children: undefined });
        } else if (item.children) {
          const filteredChildren = rebuildTree(item.children);
          if (filteredChildren.length > 0) {
            acc.push({ ...item, children: filteredChildren });
          }
        }
        return acc;
      }, [] as Menu[]);
    };

    return {
      filteredItems: rebuildTree(items),
      searchExpandedItems: expandedIds,
    };
  }, [items, searchValue, searchIndex]);

  const allItemTitles = useMemo(
    () =>
      Array.from(searchIndex.byPhrase.keys()).sort(
        (a, b) => a.length - b.length,
      ),
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
