import type { Menu } from '../../../../EtendoHookBinder/src/api/types';
import React from 'react';

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

export interface MenuTitleProps {
  item: Menu;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  selected?: boolean;
  expanded?: boolean;
  open?: boolean;
}

export interface DrawerSectionProps {
  item: Menu;
  onClick: NavigateFn;
  open?: boolean;
}

export interface DrawerSubsectionProps {
  item: Menu;
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

export interface HoverMenuProps {
  item: Menu;
  onClick: NavigateFn;
}
