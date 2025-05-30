import type { MenuProps } from "@mui/material";

export interface ISection {
  name: string;
  items: { id: string; img: string | React.ReactNode; label?: string }[];
  selectedItem: number;
}

export interface IConfigurationModalProps extends Omit<MenuProps, "open" | "title"> {
  icon?: React.ReactNode;
  title?: { icon?: string | React.ReactNode; label?: string };
  tooltipButtonProfile?: string;
  linkTitle?: { url?: string; label?: string };
  sections?: ISection[];
  open?: boolean;
  onChangeSelect?: (id: string, sectionIndex: number, imageIndex: number) => void;
}
