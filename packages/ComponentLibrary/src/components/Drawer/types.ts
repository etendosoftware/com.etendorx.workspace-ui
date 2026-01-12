/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Menu } from "@workspaceui/api-client/src/api/types";
import type { VersionProps } from "../../interfaces";

type NavigateFn = (item: Menu) => void;

export interface SearchContextType {
  searchValue: string;
  setSearchValue: (value: string) => void;
  filteredItems: Menu[];
  expandedItems: Set<string>;
  searchExpandedItems: Set<string>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  searchIndex: SearchIndex;
}

export interface DrawerProps {
  items: Menu[];
  logo?: string | React.ReactNode;
  title: string;
  onClick: NavigateFn;
  onReportClick: NavigateFn;
  onProcessClick: NavigateFn;
  // Mock Props
  headerImage?: string;
  headerTitle?: string;
  children?: React.ReactNode;
  sectionGroups?: SectionGroup[];
  windowId?: string;
  pendingWindowId?: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  RecentlyViewedComponent?: any;
  getTranslatedName?: (item: Menu) => string;
  searchContext: SearchContextType;
  VersionComponent?: React.FC<VersionProps>;
}

export interface MenuTitleProps {
  item: Menu;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  selected?: boolean;
  expanded?: boolean;
  open?: boolean;
  isExpandable?: boolean;
  popperOpen?: boolean;
  isParentActive?: boolean;
}

export interface DrawerSectionProps extends React.PropsWithChildren {
  item: Menu;
  onClick: NavigateFn;
  onReportClick?: NavigateFn;
  onProcessClick?: NavigateFn;
  open?: boolean;
  onToggleExpand: () => void;
  hasChildren: boolean;
  isExpanded: boolean;
  isExpandable: boolean;
  isSearchActive: boolean;
  reportId?: string;
  windowId?: string;
  pendingWindowId?: string;
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
  onClick: NavigateFn;
  onReportClick?: NavigateFn;
  onProcessClick?: NavigateFn;
  open: boolean;
  expandedItems: Set<string>;
  toggleItemExpansion: (itemId: string) => void;
  searchValue: string;
  windowId?: string;
  pendingWindowId?: string;
  reportId?: string;
}

export interface ToggleFunctions {
  [key: string]: () => void;
}

export interface RecentItem {
  id: string;
  name: string;
  windowId: string;
  type: string | "Window" | "Process" | "Report";
  processUrl?: string;
  isModalProcess?: boolean;
}

export interface DrawerHeaderProps {
  title: string;
  logo: string | React.ReactNode;
  open?: boolean;
  onClick: () => unknown;
  tabIndex?: number;
}

export interface RecentlyViewedProps {
  onClick: (item: Menu) => void;
  open: boolean;
  onWindowAccess?: (item: RecentItem) => void;
  recentItems?: RecentItem[];
  windowId?: string;
  items: Menu[];
  getTranslatedName?: (item: Menu) => string;
}
