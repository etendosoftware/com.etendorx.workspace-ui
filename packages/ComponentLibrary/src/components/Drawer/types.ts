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
}

export interface DrawerSectionProps {
  item: MenuSubmenu;
  onClick: NavigateFn;
}

export interface DrawerSubsectionProps {
  item: SubmenuSubmenu;
  onClick: NavigateFn;
}
