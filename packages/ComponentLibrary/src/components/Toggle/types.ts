import type { SwitchProps } from "@mui/material";

export interface ToggleChipProps extends SwitchProps {
  isActive: boolean | undefined;
  onToggle: () => void;
}
