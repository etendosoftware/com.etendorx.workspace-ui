import { ReactNode } from 'react';

export interface Section {
  label: string;
  icon: ReactNode;
  id: number | string;
}

export interface SectionGroup {
  id: number | string;
  sections: Section[];
}

export interface DrawerProps {
  children: ReactNode;
  companyName: string;
  companyLogo: string;
  sectionGroups: SectionGroup[];
}
