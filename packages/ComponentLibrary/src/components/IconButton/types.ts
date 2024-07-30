import { IconButtonProps } from '@mui/material';

export interface IIconComponentProps extends Omit<IconButtonProps, 'children'> {
  fill?: string;
  hoverFill?: string;
  width?: number;
  height?: number;
  tooltip: string;
  children: React.ReactNode;
}
