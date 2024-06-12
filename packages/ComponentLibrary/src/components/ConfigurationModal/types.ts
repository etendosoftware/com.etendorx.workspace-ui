import { MenuProps } from '@mui/material';

export interface ISection {
  name: string;
  items: { id: string; img: string; label?: string }[];
  selectedItem: number;
}

export interface IConfigurationModalProps
  extends Omit<MenuProps, 'open' | 'title'> {
  icon: string;
  title?: { icon?: string; label?: string };
  linkTitle?: { url?: string; label?: string };
  sections?: ISection[];
  open?: boolean;
  onChangeSelect?: (
    id: string,
    sectionIndex: number,
    imageIndex: number,
  ) => void;
}
