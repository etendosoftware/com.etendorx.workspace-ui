export interface Section extends Record<string, unknown> {
  id: string;
  title: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  subSections?: Section[];
  badge?: string;
  submenu: Section[],
}

export interface DrawerProps {
  sectionGroups: Section[];
  headerImage: string;
  headerTitle: string;
  onClick: (s: Section) => void;
}

export interface SectionGroup {
  id: string | number;
  sections: Section[];
}

export interface DrawerSectionProps {
  section: Section;
  open: boolean;
  onSelect: (id: string | null) => void;
  onExpand: (id: string) => void;
  isExpanded: (id: string) => boolean;
}
