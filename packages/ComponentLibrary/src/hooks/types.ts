import { RecentItem } from '../components/Drawer/types';

export interface UseRecentItemsReturn {
  localRecentItems: RecentItem[];
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  handleItemClick: (path: string) => void;
  handleToggleExpand: () => void;
  hasItems: boolean;
  resetManualToggle: () => void;
}
