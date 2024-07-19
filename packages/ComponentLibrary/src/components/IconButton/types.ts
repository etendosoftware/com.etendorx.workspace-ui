import { IconButtonProps, SxProps, Theme } from '@mui/material';

export interface IIconComponentProps extends IconButtonProps {
  fill?: string;
  hoverFill?: string;
  width?: number;
  height?: number;
  tooltip?: string;
  sx?: SxProps<Theme>;
}
