import type { MenuProps } from "@mui/material";

export interface SectionItem {
  id: string;
  img: string | React.ReactNode;
  label?: string;
}

export interface ISection {
  id: string;
  name: string;
  items: SectionItem[];
  selectedItem: number;
  isDisabled?: boolean;
}

export interface OptionSelectedProps {
  id: string;
  sectionId: string;
  sectionIndex: number;
  imageIndex: number;
}

export interface IConfigurationModalProps extends Omit<MenuProps, "open" | "title"> {
  icon?: React.ReactNode;
  title?: { icon?: string | React.ReactNode; label?: string };
  tooltipButtonProfile?: string;
  linkTitle?: { url?: string; label?: string };
  sections?: ISection[];
  open?: boolean;
  onChangeSelect?: (optionSelected: OptionSelectedProps) => void;
}
