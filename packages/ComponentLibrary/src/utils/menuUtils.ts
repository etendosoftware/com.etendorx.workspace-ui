import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { RecentItem } from '../components/Drawer/types';
import { TranslateFunction } from '@workspaceui/mainui/hooks/types';

const RECENTLY_VIEWED_ICON = '⌛';

const getActionByType = (type: string): string => {
  switch (type) {
    case 'Process':
      return 'P';
    case 'Report':
      return 'R';
    default:
      return 'W';
  }
};

const isItemMatch = (item: Menu, identifier: string): boolean => {
  if (item.type === 'Window') {
    return item.windowId === identifier;
  }
  if (item.type === 'Report' || item.type === 'Process') {
    return item.id === identifier;
  }
  return item.windowId === identifier || item.id === identifier;
};

export const findItemByIdentifier = (items?: Menu[], identifier?: string): Menu | null => {
  if (!items?.length || !identifier) return null;

  for (const item of items) {
    if (isItemMatch(item, identifier)) {
      return item;
    }

    if (item.children?.length) {
      const found = findItemByIdentifier(item.children, identifier);
      if (found) return found;
    }
  }

  return null;
};

export const createMenuItem = (id: string, name: string, entityName: string): Menu => ({
  _identifier: id,
  _entityName: entityName,
  $ref: id,
  recordTime: Date.now(),
  id,
  name,
});

export const createRecentMenuItem = (item: RecentItem): Menu => ({
  ...createMenuItem(`recent-${item.id}`, item.name, item.type),
  windowId: item.type === 'Window' ? item.windowId : item.id,
  action: getActionByType(item.type),
  type: item.type,
});
export const createParentMenuItem = (items: RecentItem[], t: TranslateFunction): Menu => {
  const baseMenuItem = {
    ...createMenuItem('recently-viewed', t('drawer.recentlyViewed'), 'RecentlyViewed'),
    icon: RECENTLY_VIEWED_ICON,
    type: 'Window',
    action: 'W',
  };

  if (!items?.length || typeof items.map != 'function') {
    return baseMenuItem;
  }

  return {
    ...baseMenuItem,
    type: items[0].type || 'Window',
    children: items.map(createRecentMenuItem),
  };
};
