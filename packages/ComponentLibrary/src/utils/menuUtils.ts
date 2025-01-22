import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { RecentItem } from '../components/Drawer/types';
import { TranslateFunction } from '@workspaceui/mainui/hooks/types';

const RECENTLY_VIEWED_ICON = '⌛';

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
  action: item.type === 'Process' ? 'P' : item.type === 'Report' ? 'R' : 'W',
  type: item.type,
});

export const createParentMenuItem = (items: RecentItem[], t: TranslateFunction): Menu => {
  const baseMenuItem = {
    ...createMenuItem('recently-viewed', t('drawer.recentlyViewed'), 'RecentlyViewed'),
    icon: RECENTLY_VIEWED_ICON,
    type: 'Window',
    action: 'W',
  };

  if (!items?.length) {
    return baseMenuItem;
  }

  return {
    ...baseMenuItem,
    type: items[0].type || 'Window',
    children: items.map(createRecentMenuItem),
  };
};

export const findItemByIdentifier = (items?: Menu[], identifier?: string): Menu | null => {
  if (!items || !identifier) return null;

  for (const item of items) {
    if (item.type === 'Window' && item.windowId === identifier) {
      return item;
    }
    if ((item.type === 'Report' || item.type === 'Process') && item.id === identifier) {
      return item;
    }
    if (item.children) {
      const found = findItemByIdentifier(item.children, identifier);
      if (found) return found;
    }
  }
  return null;
};
