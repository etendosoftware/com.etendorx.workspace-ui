import { SvgIconComponent } from '@mui/icons-material';

export interface Section {
  label: string;
  icon: SvgIconComponent;
  id: number;
}

export interface SectionGroup {
  sections: Section[];
  id: number;
}

export interface DrawerProps {
  sectionGroups: SectionGroup[];
  children: React.ReactNode;
}
