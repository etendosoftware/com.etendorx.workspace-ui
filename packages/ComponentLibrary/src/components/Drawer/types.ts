export interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  subSections?: Section[];
  badge?: string;
}

export interface DrawerProps {
  sectionGroups: SectionGroup[];
  headerImage: string;
  headerTitle: string;
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
