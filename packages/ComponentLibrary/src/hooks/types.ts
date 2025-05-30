import type { Menu } from "@workspaceui/etendohookbinder/src/api/types";
import type { RecentItem } from "../components/Drawer/types";

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
  onWindowClick?: (item: Menu) => void;
  onReportClick?: (item: Menu) => void;
  onProcessClick?: (item: Menu) => void;
}
