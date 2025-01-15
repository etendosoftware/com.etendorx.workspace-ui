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

export const createParentMenuItem = (items: RecentItem[], t: TranslateFunction): Menu => ({
  ...createMenuItem('recently-viewed', t('drawer.recentlyViewed'), 'RecentlyViewed'),
  icon: RECENTLY_VIEWED_ICON,
  type: items[0].type || 'Window',
  action: 'W',
  children: items.map(createRecentMenuItem),
});
