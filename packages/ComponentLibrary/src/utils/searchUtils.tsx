import type { Menu } from "@workspaceui/api-client/src/api/types";
import type { IndexedMenu, SearchIndex } from "../components/Drawer/types";

const index: SearchIndex = {
  byId: new Map(),
  byPhrase: new Map(),
};

const addToPhraseIndex = (phrase: string, id: string) => {
  if (!index.byPhrase.has(phrase)) {
    index.byPhrase.set(phrase, new Set());
  }
  index.byPhrase.get(phrase)?.add(id);
};

const traverse = (items: Menu[], path: string[] = [], fullPath = "") => {
  for (const item of items) {
    const newFullPath = fullPath ? `${fullPath} > ${item.name}` : item.name;
    const indexedItem: IndexedMenu = { ...item, path, fullPath: newFullPath };
    index.byId.set(item.id, indexedItem);

    const lowerName = item.name.toLowerCase();
    addToPhraseIndex(lowerName, item.id);

    const words = lowerName.split(/\s+/);
    for (const word of words) {
      addToPhraseIndex(word, item.id);
    }

    addToPhraseIndex(newFullPath.toLowerCase(), item.id);

    if (Array.isArray(item.children)) {
      traverse(item.children, [...path, item.id], newFullPath);
    }
  }
};

export const createSearchIndex = (items: Menu[]): SearchIndex => {
  try {
    traverse(items);
  } catch (e) {
    console.warn("Error in createSearchIndex", e);
  }

  return index;
};

const findMatchingIds = (searchValue: string, searchIndex: SearchIndex): Set<string> => {
  const lowerSearchValue = searchValue.toLowerCase();
  const matchingIds = new Set<string>();

  for (const [phrase, ids] of searchIndex.byPhrase) {
    if (phrase.includes(lowerSearchValue)) {
      for (const id of ids) {
        const item = searchIndex.byId.get(id);
        if (item?.name.toLowerCase().includes(lowerSearchValue)) {
          matchingIds.add(id);
        }
      }
    }
  }

  return matchingIds;
};

const findMatchingIdsForWords = (searchWords: string[], searchIndex: SearchIndex): Set<string> => {
  const allMatchingIds = new Set<string>();

  for (const word of searchWords) {
    for (const [phrase, ids] of searchIndex.byPhrase) {
      if (phrase.includes(word)) {
        for (const id of ids) {
          allMatchingIds.add(id);
        }
      }
    }
  }

  return new Set(
    Array.from(allMatchingIds).filter((id) => {
      const item = searchIndex.byId.get(id);
      return searchWords.every((word) => item?.name.toLowerCase().includes(word));
    }),
  );
};

const getExpandedIds = (matchingIds: Set<string>, searchIndex: SearchIndex): Set<string> => {
  const expandedIds = new Set<string>();
  for (const id of matchingIds) {
    const item = searchIndex.byId.get(id);
    if (item?.path) {
      for (const pathId of item.path) {
        expandedIds.add(pathId);
      }
    }
  }
  return expandedIds;
};

export const getAllItemTitles = (searchIndex: SearchIndex): string[] => {
  return Array.from(searchIndex.byPhrase.keys()).sort((a, b) => a.length - b.length);
};

export const rebuildTree = (items: Menu[], matchingIds: Set<string>): Menu[] => {
  return items.reduce<Menu[]>((acc, item) => {
    const childrenMatching = item.children ? rebuildTree(item.children, matchingIds).length > 0 : false;
    const shouldInclude = matchingIds.has(item.id) || childrenMatching;

    if (shouldInclude) {
      const filteredChildren = item.children ? rebuildTree(item.children, matchingIds) : [];
      acc.push({
        ...item,
        isSearchResult: true,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
      });
    }

    return acc;
  }, []);
};

export const filterItems = (
  items: Menu[],
  searchValue: string,
  searchIndex: SearchIndex,
): { filteredItems: Menu[]; searchExpandedItems: Set<string> } => {
  if (!searchValue || !Array.isArray(items)) return { filteredItems: items, searchExpandedItems: new Set() };

  let matchingIds = findMatchingIds(searchValue, searchIndex);
  if (matchingIds.size === 0) {
    const searchWords = searchValue.toLowerCase().split(/\s+/);
    matchingIds = findMatchingIdsForWords(searchWords, searchIndex);
  }

  const expandedIds = getExpandedIds(matchingIds, searchIndex);
  const filteredItems = rebuildTree(items, matchingIds);

  return { filteredItems, searchExpandedItems: expandedIds };
};
