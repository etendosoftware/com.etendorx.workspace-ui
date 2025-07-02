import type { SxProps, Theme } from "@mui/material";
import type { TagType } from "./components/Tag/types";

export interface CtaButton {
  key: string;
  label: string;
  action: () => void;
  icon?: React.ComponentType;
  sx?: SxProps<Theme>;
}

export interface Inotifications {
  id: string;
  description: string;
  date: string;
  priority?: string;
  tagType?: TagType;
  icon: React.ComponentType;
  ctaButtons?: CtaButton[];
}
