import type { Menu } from '../../../../EtendoHookBinder/src/api/types';

type NavigateFn = (pathname: string) => void;

export interface DrawerProps {
  items: Menu[];
  logo?: string | React.ReactNode;
  title: string;
  onClick: NavigateFn;
  // Mock Props
  headerImage?: string;
  headerTitle?: string;
  children?: React.ReactNode;
  sectionGroups?: SectionGroup[];
  windowId?: string;
}

export interface MenuTitleProps {
  item: Menu;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  selected?: boolean;
  expanded?: boolean;
  open?: boolean;
  isExpandable?: boolean;
}

export interface DrawerSectionProps extends React.PropsWithChildren {
  item: Menu;
  onClick: NavigateFn;
  open?: boolean;
  onToggleExpand: () => void;
  hasChildren: boolean;
  isExpanded: boolean;
  isExpandable: boolean;
  isSearchActive: boolean;
  windowId?: string;
  parentId?: string;
}

export interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  subSections?: Section[];
  badge?: string;
}

export interface SectionGroup {
  id: string | number;
  sections: Section[];
}

export interface IndexedMenu extends Menu {
  path: string[];
  fullPath: string;
}

export interface SearchIndex {
  byId: Map<string, IndexedMenu>;
  byPhrase: Map<string, Set<string>>;
}

export interface DrawerItemsProps {
  items: Menu[];
  onClick: (path: string) => void;
  open: boolean;
  expandedItems: Set<string>;
  toggleItemExpansion: (itemId: string) => void;
  searchValue: string;
  windowId?: string;
}

export interface RecentItem {
  id: string;
  name: string;
  windowId: string;
}

export interface DrawerHeaderProps {
  title: string;
  logo: string | React.ReactNode;
  open?: boolean;
  onClick: () => unknown;
  tabIndex?: number;
}

export interface RecentlyViewedProps {
  onClick: (path: string) => void;
  open: boolean;
  onWindowAccess: (item: RecentItem) => void;
  recentItems: RecentItem[];
}
