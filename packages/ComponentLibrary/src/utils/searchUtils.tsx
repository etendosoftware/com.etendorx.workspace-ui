import { IndexedMenu, SearchIndex } from '../components/Drawer/types';
import type { Menu } from '../../../EtendoHookBinder/src/api/types';

export const createSearchIndex = (items: Menu[]): SearchIndex => {
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

export const filterItems = (
  items: Menu[],
  searchValue: string,
  searchIndex: SearchIndex,
): { filteredItems: Menu[]; searchExpandedItems: Set<string> } => {
  if (!searchValue || !Array.isArray(items))
    return { filteredItems: items, searchExpandedItems: new Set<string>() };

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
        acc.push({ ...item, isSearchResult: true });
      } else if (item.children) {
        const filteredChildren = rebuildTree(item.children);
        if (filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren,
            isSearchResult: true,
          });
        }
      }
      return acc;
    }, [] as Menu[]);
  };

  return {
    filteredItems: rebuildTree(items),
    searchExpandedItems: expandedIds,
  };
};

export const getAllItemTitles = (searchIndex: SearchIndex): string[] => {
  return Array.from(searchIndex.byPhrase.keys()).sort(
    (a, b) => a.length - b.length,
  );
};
