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
  ...createMenuItem(`recent-${item.id}`, item.name, item.windowId),
  windowId: item.windowId,
  action: 'W',
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

export const findItemByWindowId = (items?: Menu[], windowId?: string): Menu | null => {
  if (!items || !windowId) return null;

  for (const item of items) {
    if (item.windowId === windowId) return item;
    if (item.children) {
      const found = findItemByWindowId(item.children, windowId);
      if (found) return found;
    }
  }
  return null;
};
