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

export interface UseItemActionsProps {
  onWindowClick?: (windowId: string) => void;
  onReportClick?: (reportId: string, recordId: string) => void;
  onProcessClick?: (processId: string) => void;
}
