import type { SxProps, Theme } from "@mui/material";
import type { TagType } from "../Tag/types";

export interface CtaButton {
  key: string;
  label: string;
  action: () => void;
  icon?: React.ComponentType;
  sx?: SxProps<Theme>;
}

export interface NotificationItemProps {
  description: string;
  priority?: string;
  tagType?: TagType;
  date: string;
  icon: React.ComponentType;
  ctaButtons?: CtaButton[];
}
