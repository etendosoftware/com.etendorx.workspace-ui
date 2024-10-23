import { Menu } from '@workspaceui/etendohookbinder/api/types';
import { RecentItem } from '../components/Drawer/types';

export const createMenuItem = (id: string, name: string, entityName: string): Menu => ({
  _identifier: id,
  _entityName: entityName,
  $ref: id,
  recordTime: Date.now(),
  id,
  name,
});

export const createRecentMenuItem = (item: RecentItem): Menu => ({
  ...createMenuItem(`recent-${item.id}`, item.name, 'RecentItem'),
  windowId: item.windowId,
  action: 'W',
});

export const createParentMenuItem = (items: RecentItem[]): Menu => ({
  ...createMenuItem('recently-viewed', '⌛ Recently Viewed', 'RecentlyViewed'),
  children: items.map(createRecentMenuItem),
});
