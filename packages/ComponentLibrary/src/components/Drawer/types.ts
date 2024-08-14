import type {
  Menu,
  MenuSubmenu,
  SubmenuSubmenu,
} from '../../../../EtendoHookBinder/src/api/types';

type NavigateFn = (pathname: string) => void;
export interface DrawerProps {
  items: Menu[];
  logo: string;
  title: string;
  onClick: NavigateFn;
  // Mock Props
  headerImage?: string;
  headerTitle?: string;
  children?: React.ReactNode;
  sectionGroups?: SectionGroup[];
}

export interface DrawerSectionProps {
  item: MenuSubmenu;
  onClick: NavigateFn;
}

export interface DrawerSubsectionProps {
  item: SubmenuSubmenu;
  onClick: NavigateFn;
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
